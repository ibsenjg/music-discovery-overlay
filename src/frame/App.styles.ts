import { styled } from 'styled-components';
import { media } from './styles/media';
import { tokens } from './styles/theme';

export const Drawer = styled.aside`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid ${tokens.border};
  background: ${tokens.surface};
  box-shadow: -14px 0 40px ${tokens.shadowPanel};

  ${media.narrow} {
    border-top: 1px solid ${tokens.border};
    border-left: 0;
    border-radius: 20px 20px 0 0;
  }
`;

export const DrawerScroll = styled.div.attrs({ className: 'drawer-scroll' })`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-anchor: none;
  overscroll-behavior: contain;
  padding: ${tokens.spaceFour} ${tokens.spaceFour} 32px;
`;

export const VisibleNotice = styled.p.attrs({
  className: 'visible-status',
})`
  margin: ${tokens.spaceFour} 0 0;
  border: 1px solid ${tokens.border};
  border-radius: ${tokens.radiusMedium};
  padding: ${tokens.spaceThree};
  color: ${tokens.muted};
  background: ${tokens.surfaceNotice};
  line-height: 1.45;
`;
