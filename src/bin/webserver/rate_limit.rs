use governor;

use rouille::{Request, Response};
use std::net::IpAddr;
use std::num::NonZeroU32;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Duration;

use std::panic;

pub struct RateLimiter {
    current_running: AtomicUsize,
    rate_limiter: governor::RateLimiter<
        IpAddr,
        governor::state::keyed::DefaultKeyedStateStore<IpAddr>,
        governor::clock::DefaultClock,
    >,
}

const PERSONAL_RATE_LIMIT: &'static str = r#"{"rate_limited":true,"personal":true}"#;
const GLOBAL_RATE_LIMIT: &'static str = r#"{"rate_limited":true,"personal":false}"#;

impl RateLimiter {
    pub fn new(total: usize, per_time_unit: Duration) -> Self {
        RateLimiter {
            current_running: AtomicUsize::new(total),
            rate_limiter: governor::RateLimiter::keyed(
                governor::Quota::with_period(per_time_unit)
                    .expect("Non-zero per unit time expected")
                    .allow_burst(NonZeroU32::new(1).unwrap()),
            ),
        }
    }

    pub fn rate_limit(
        &self,
        request: &Request,
        rate_limited_fn: impl FnOnce(&Request) -> Response + panic::UnwindSafe,
    ) -> Response {
        let key = request.remote_addr().ip();
        if self.rate_limiter.check_key(&key).is_err() {
            return Response::from_data("application/json; charset=utf8", PERSONAL_RATE_LIMIT)
                .with_status_code(429);
        }

        let should_allow =
            self.current_running
                .fetch_update(Ordering::SeqCst, Ordering::SeqCst, |old_value| {
                    if old_value == 0 {
                        None
                    } else {
                        Some(old_value - 1)
                    }
                });
        if should_allow.is_err() {
            return Response::from_data("application/json; charset=utf8", GLOBAL_RATE_LIMIT)
                .with_status_code(429);
        }

        let response = panic::catch_unwind(|| rate_limited_fn(request));

        self.current_running.fetch_add(1, Ordering::SeqCst);

        response.unwrap() // continue the panic if there was one
    }
}
