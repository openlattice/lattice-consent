/*
 * @flow
 */

import styled from 'styled-components';

const Text = styled.div`
  text-align: ${(props) => props.align || 'left'};
`;

export default Text;
