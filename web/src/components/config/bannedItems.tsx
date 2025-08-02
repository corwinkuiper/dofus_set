import { Stack } from "../base/stack";
import { SearchAllItemsBox } from "./search";
import { useImmerAtom } from "@/state/state";
import {
  BannedItemCategory,
  BannedItemCategoryItems,
  bannedItemsAtom,
  bannedItemsCategoryAtom,
} from "@/state/bannedItemsState";
import { styled } from "styled-components";
import { ActionDelete, ItemDisplay } from "../item";
import { enableMapSet } from "immer";

enableMapSet();

const SetBox = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(192px, auto));
  max-width: 100%;
  max-height: 400px;
  overflow-y: scroll;
`;

interface CategoryBanProps {
  category: BannedItemCategory;
}

function CategoryBan({ category }: CategoryBanProps) {
  const [bannedCategories, updateBannedCategories] = useImmerAtom(
    bannedItemsCategoryAtom
  );

  return (
    <label>
      {category}{" "}
      <input
        type="checkbox"
        checked={bannedCategories.has(category)}
        onChange={(evt) =>
          updateBannedCategories((cat) => {
            if (evt.target.checked) {
              cat.add(category);
            } else {
              cat.delete(category);
            }
          })
        }
      />
    </label>
  );
}

const CategoryBanStack = styled(Stack)`
  gap: 32px;
  flex-wrap: wrap;
`;

export function BannedItems() {
  const [items, updateItems] = useImmerAtom(bannedItemsAtom);

  return (
    <Stack $dir="h">
      <SearchAllItemsBox
        item={(item) => {
          updateItems((items) => {
            if (items.has(item.dofusId)) {
              items.delete(item.dofusId);
            } else {
              items.set(item.dofusId, item);
            }
          });
        }}
      />
      <Stack $grow>
        <SetBox>
          {[
            ...items.entries().map(([, x]) => (
              <ItemDisplay
                key={x.dofusId}
                slot={-1}
                item={x}
                actions={
                  <ActionDelete
                    action={() =>
                      updateItems((items) => {
                        items.delete(x.dofusId);
                      })
                    }
                  />
                }
              />
            )),
          ]}
        </SetBox>
        <CategoryBanStack $dir="h">
          {BannedItemCategoryItems.map((x) => (
            <CategoryBan key={x} category={x} />
          ))}
        </CategoryBanStack>
      </Stack>
    </Stack>
  );
}
