import { styled } from 'styled-components';
import { media } from '../styles/media';
import { BaseButton, Heading2 } from '../styles/primitives';
import { tokens } from '../styles/theme';

export const FiltersSection = styled.section`
  margin-top: 0;
`;

export const SelectedSection = styled.section`
  margin-top: ${tokens.spaceFive};
`;

export const SectionHeadingRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${tokens.spaceTwo};
  margin-bottom: ${tokens.spaceThree};
`;

export const SectionHeading = styled(Heading2)`
  margin-bottom: 2px;
`;

export const SelectedHeading = Heading2;

export const SelectionCount = styled.span`
  color: ${tokens.muted};
  font-size: 0.75rem;
`;

export const CompactActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${tokens.spaceTwo};
`;

export const CompactButton = styled(BaseButton)`
  min-height: 34px;
  padding: 5px 8px;
  font-size: 0.78rem;
`;

export const ChipGroup = styled.fieldset`
  margin: 0 0 ${tokens.spaceThree};
  border: 0;
  padding: 0;
`;

export const ChipLegend = styled.legend`
  margin-bottom: ${tokens.spaceTwo};
  color: ${tokens.muted};
  font-size: 0.78rem;
  font-weight: 700;
`;

export const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${tokens.spaceTwo};
`;

export const ChipButton = styled(BaseButton)`
  min-height: 36px;
  border-radius: 999px;
  padding: 6px 11px;

  &[aria-pressed='true'] {
    border-color: ${tokens.accent};
    color: ${tokens.accentInk};
    background: ${tokens.accent};
    font-weight: 800;
  }

  ${media.forcedColors} {
    &[aria-pressed='true'] {
      border-width: 3px;
    }
  }
`;

export const SelectedList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${tokens.spaceTwo};
`;

export const SelectedChipButton = styled(BaseButton)`
  min-height: 34px;
  border-style: dashed;
  padding: 5px 9px;
  font-size: 0.82rem;
`;
