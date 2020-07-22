/*
Component test per prove con react

*/

import React from 'react';
import Box from '../box/box.jsx';
import PropTypes from 'prop-types';
import StageWrapper from '../stage-wrapper/stage-wrapper.jsx';
// import styles from '../asset-panel/asset-panel.css';
// import styles from '../stage/stage.css';
import styles from '../gui/gui.css';
import Renderer from 'scratch-render';
import layout, {STAGE_SIZE_MODES} from '../../lib/layout-constants';
import {resolveStageSize} from '../../lib/screen-utils';
import MediaQuery from 'react-responsive';
import classNames from 'classnames';
import TargetPane from '../../containers/target-pane.jsx';

import omit from 'lodash.omit';
import VM from 'scratch-vm';
import { checkPropTypes } from 'prop-types';

let isRendererSupported = null;

const Prova = (props) => {
    const {
        dragRef,
        isRtl,
        stageSizeMode,
        vm,
        ...componentProps
    } = props;
    console.log(props);

    if (isRendererSupported === null) {
        isRendererSupported = Renderer.isSupported();
    }
    const stageSize = "largeConstrained";
    return(
        /* {<MediaQuery minWidth={layout.fullSizeMinWidth}>{isFullSize => { */
            

            <Box className={classNames(styles.stageAndTargetWrapper, styles[stageSize])}>
                <h1>CIAO</h1>
                <StageWrapper
                    isRendererSupported={isRendererSupported}
                    isRtl={isRtl}
                    stageSize={stageSize}
                    vm={vm}
                />          
            </Box>
        /* }}</MediaQuery> */);
};

Prova.propTypes = {
    isRtl: PropTypes.bool,
    isRendererSupported: PropTypes.bool,
    dragRef: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired
};
Prova.defaultProps = {
    dragRef: () => {}
};

const mapStateToProps = state => ({
    // This is the button's mode, as opposed to the actual current state
    stageSizeMode: state.scratchGui.stageSize.stageSize
});

export default Prova;

{/* <Box className={styles.stageWrapper}>
            {props.children}
            <canvas
                className={styles.draggingSprite}
                height={0}
                ref={dragRef}
                width={0}
            />
</Box> */}