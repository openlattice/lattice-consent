/*
 * @flow
 */

import React from 'react';
import type { Node } from 'react';

import styled from 'styled-components';
import { AppContainerWrapper, AppContentWrapper } from 'lattice-ui-kit';

const FrameContainerWrapper = styled(AppContainerWrapper)`
  background: white;
  min-width: 0;
`;

const FrameContentWrapper = styled(AppContentWrapper)`
  > div {
    background: white;
    flex: 1 1 auto;
    min-width: 0;
    padding: ${(props) => props.padding || '30px'};
  }
`;

type Props = {
  children :Node;
  padding ?:string;
};

const Frame = ({ children, padding } :Props) => (
  <FrameContainerWrapper>
    <FrameContentWrapper padding={padding}>
      {children}
    </FrameContentWrapper>
  </FrameContainerWrapper>
);

Frame.defaultProps = {
  padding: '30px'
};

export default Frame;
