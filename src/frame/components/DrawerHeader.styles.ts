import { styled } from 'styled-components';
import { media } from '../styles/media';
import { IconButton } from '../styles/primitives';
import { tokens } from '../styles/theme';

export const Header = styled.header`
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 42px;
  align-items: center;
  flex: 0 0 auto;
  gap: ${tokens.spaceThree};
  min-height: 64px;
  border-bottom: 1px solid ${tokens.border};
  padding: 10px ${tokens.spaceFour};
  background: ${tokens.surface};

  ${media.narrow} {
    min-height: 58px;
  }
`;

export const HeaderMark = styled.span.attrs({ className: 'header-mark' })`
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
  color: ${tokens.accent};
  background: ${tokens.markSurface};

  svg {
    width: 30px;
    height: 30px;
  }
`;

export const Title = styled.h1`
  overflow: hidden;
  margin: 0;
  font-size: 1.08rem;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const MinimizeButton = IconButton;
