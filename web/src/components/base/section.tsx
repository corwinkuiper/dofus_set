import { ReactNode } from "react";
import { styled } from "styled-components";

const SectionWrapper = styled.details`
  border: 1px solid black;
  margin: 2px;
  padding: 8px;
`;

const Content = styled.div``;

const Summary = styled.summary`
  margin: 0;
  margin-bottom: 4px;
  padding: 0;
`;

const Title = styled.span`
  font-weight: bold;
  font-size: 1.4rem;
`;

interface SectionProps {
  title: string;
  children: ReactNode;
  closed?: boolean;
}

export function Section({ title, children, closed = false }: SectionProps) {
  return (
    <SectionWrapper open={!closed}>
      <Summary>
        <Title>{title}</Title>
      </Summary>
      <Content>{children}</Content>
    </SectionWrapper>
  );
}
