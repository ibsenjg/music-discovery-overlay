import { styled } from 'styled-components';
import { ScreenReaderOnlyBlock, Spinner } from '../styles/primitives';
import { tokens } from '../styles/theme';

export const AppMarkGraphic = styled.svg``;

export const MarkBeamOne = styled.rect`
  fill: ${tokens.brandOne};
`;

export const MarkBeamTwo = styled.rect`
  fill: ${tokens.brandTwo};
`;

export const MarkBeamThree = styled.rect`
  fill: ${tokens.brandThree};
`;

export const MarkStar = styled.path`
  fill: ${tokens.brandOne};
`;

export const LoadingIndicator = Spinner;
export const PersistentStatus = ScreenReaderOnlyBlock;
