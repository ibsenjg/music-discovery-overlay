import { translate } from '../../shared/i18n';
import { ALL_CHIPS, ONTOLOGY_SECTIONS } from '../../shared/ontology';
import type { Locale } from '../../shared/types';
import {
  ChipButton,
  ChipGroup,
  ChipLegend,
  Chips,
  CompactActions,
  CompactButton,
  FiltersSection,
  SectionHeading,
  SectionHeadingRow,
  SelectedChipButton,
  SelectedHeading,
  SelectedList,
  SelectedSection,
  SelectionCount,
} from './DiscoveryFilters.styles';

export function DiscoveryFilters({
  locale,
  selectedChipIds,
  canUndo,
  onToggleChip,
  onClearAll,
  onUndo,
}: {
  locale: Locale;
  selectedChipIds: string[];
  canUndo: boolean;
  onToggleChip: (id: string) => void;
  onClearAll: () => void;
  onUndo: () => void;
}) {
  return (
    <>
      <FiltersSection aria-labelledby="categories-title">
        <SectionHeadingRow>
          <div>
            <SectionHeading id="categories-title">
              {translate(locale, 'categories')}
            </SectionHeading>
            {selectedChipIds.length > 0 && (
              <SelectionCount>
                {translate(locale, 'selectedFiltersCount', {
                  count: selectedChipIds.length,
                })}
              </SelectionCount>
            )}
          </div>
          <CompactActions>
            <CompactButton type="button" onClick={onClearAll}>
              {translate(locale, 'clearAll')}
            </CompactButton>
            {canUndo && (
              <CompactButton type="button" onClick={onUndo}>
                {translate(locale, 'undo')}
              </CompactButton>
            )}
          </CompactActions>
        </SectionHeadingRow>
        {ONTOLOGY_SECTIONS.map((section) => (
          <ChipGroup key={section.id}>
            <ChipLegend>{section.label[locale]}</ChipLegend>
            <Chips>
              {section.chips.map((chip) => {
                const selected = selectedChipIds.includes(chip.id);
                return (
                  <ChipButton
                    key={chip.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onToggleChip(chip.id)}
                  >
                    {chip.label[locale]}
                  </ChipButton>
                );
              })}
            </Chips>
          </ChipGroup>
        ))}
      </FiltersSection>

      {selectedChipIds.length > 0 && (
        <SelectedSection aria-labelledby="selected-title">
          <SelectedHeading id="selected-title">
            {translate(locale, 'selectedFilters')}
          </SelectedHeading>
          <SelectedList>
            {selectedChipIds.map((id) => {
              const chip = ALL_CHIPS.find((item) => item.id === id);
              if (!chip) return null;
              return (
                <SelectedChipButton
                  key={id}
                  type="button"
                  onClick={() => onToggleChip(id)}
                  aria-label={translate(locale, 'removeFilter', {
                    label: chip.label[locale],
                  })}
                >
                  {chip.label[locale]} <span aria-hidden="true">×</span>
                </SelectedChipButton>
              );
            })}
          </SelectedList>
        </SelectedSection>
      )}
    </>
  );
}
