import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';
import log from '../lib/log.js';

import {connect} from 'react-redux';

import {defineMessages, intlShape, injectIntl} from 'react-intl';

import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';


import randomizeSpritePosition from '../lib/randomize-sprite-position';
// import spriteTags from '../lib/libraries/sprite-tags';

import BotchLifeTree from '../components/botch/botch-life-tree.jsx';


import {
    activateTab,
    COSTUMES_TAB_INDEX
} from '../reducers/editor-tab';

import {setRestore} from '../reducers/restore-deletion';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';

/* global BOTCH */

const messages = defineMessages({
    libraryTitle: {
        defaultMessage: 'Choose a Sprite',
        description: 'Heading for the sprite library',
        id: 'gui.botchDebugTab.lifetree'
    }
});


class BotchDebugTab extends React.Component {

    /**
     *
     * @param {@s} event the mouse event
     * @returns {{x:float,y:float}} the point in relative coordinates
     * @since botch-0.3
     */
    static getPointFromEvent (event) {
        const svg = event.currentTarget;
        // Create an SVG point that contains x & y values
        const point = svg.createSVGPoint();

        // If even is triggered by a touch event, we get the position of the first finger
        if (event.targetTouches) {
            point.x = event.targetTouches[0].clientX;
            point.y = event.targetTouches[0].clientY;
        } else {
            point.x = event.clientX;
            point.y = event.clientY;
        }
        
        // We get the current transformation matrix of the SVG and we inverse it
        const invertedSVGMatrix = svg.getScreenCTM().inverse();
        
        return point.matrixTransform(invertedSVGMatrix);
    }

    /**
     * Calculates the layed out node group total width.
     * @param {array} nodeGroup list of nodes
     * @param {object} measures the measures
     * @returns {int} the width of the layed out node group.
     * @since botch-0.3
     */
    static calcGroupWidth (nodeGroup, measures){
        const m = measures;
        return (m.nodeh * nodeGroup.length) + (m.deltah * 2 * (nodeGroup.length - 1));
    }

    /**
     * Takes a generation of node groups and calculates x and y of nodes.
     *
     *              left                       right
     *              limit                      limit
     *                |                          |
     *                | |----|   |----|   |----| |
     *                |-|____|-|-|____|-|-|____|-|
     *   |________|-|-| |  \________|________/ | |-|-|_______|
     *        |         |           |          |         |
     *                  |           px         |
     *                  |----------------------|
     *                           groupw
     *
     * @param {object} viz info about viewport and measures
     * @param {object} layout the layout
     * @param {array[]} generation the list of node groups
     * @param {int} genNum the generation number
     * @since botch-0.3
     */
    static updateFrontierLayout (viz, layout, generation, genNum){
        if (genNum === 0){
            return;
        }
        const vb = viz.viewBox;
        const m = viz.measures;
        
        const midIndex = Math.floor(generation.length / 2);
        const midGroup = generation[midIndex];
        const midX = layout[midGroup[0].parentId].x - (BotchDebugTab.calcGroupWidth(midGroup, m) / 2);
                
        let rightLimit = midX - m.deltaw;
        // first calculate left side
        for (const nodeGroup of generation.slice(0, midIndex).reverse()){

            const px = layout[nodeGroup[0].parentId].x;
            const groupw = BotchDebugTab.calcGroupWidth(nodeGroup, m);
            rightLimit = Math.min(rightLimit, px + (groupw / 2));
            
            for (let i = 0; i < nodeGroup.length; i++){
                const node = nodeGroup[i];
                // |____|-|-|____|-|-|____|-|-|
                //    |        |        |
                node.x = rightLimit - groupw + (m.nodew / 2) + ((m.nodew + (m.deltaw * 2)) * i);
                node.xoff = node.x - (m.nodew / 2);
                node.y = vb.height - (m.nodeh + (m.levh * (genNum - 1)) - (m.nodeh / 2));
                node.yoff = node.y - (m.nodeh / 2);
            }
            rightLimit = rightLimit - groupw - (2 * m.deltaw);
        }
        // then calculate right side
        let leftLimit = midX + m.deltaw;
        for (const nodeGroup of generation.slice(midIndex, generation.length)){
            /*   x   x   x   x
                       |
            */
            const px = layout[nodeGroup[0].parentId].x;
            
            const groupw = (m.nodeh * nodeGroup.length) + (m.deltah * 2 * (nodeGroup.length - 1));
            leftLimit = Math.max(leftLimit, px - (groupw / 2));
            for (let i = 0; i < nodeGroup.length; i++){
                const node = nodeGroup[i];
                
                node.x = leftLimit + (m.nodew / 2) + ((m.nodew + (m.deltaw * 2)) * i);
                node.xoff = node.x - (m.nodew / 2);
                node.y = vb.height - (m.nodeh + (m.levh * (genNum - 1)) - (m.nodeh / 2));
                node.yoff = node.y - (m.nodeh / 2);
            }
            leftLimit = leftLimit + groupw + (2 * m.deltaw);
            
        }
    }

    /**
     * Apparently having derived expensive computations inside life tree component
     * could be 'an antipattern', so I put laout calculation in the controller container.
     *
     * @param {*} viz object with viewport and measures
     * @param {*} libSprites list of sprites as loaded from storageHelper
     * @returns {object} the calculated layout, notice it has pointers to libSprites
     *                    without changing the contained objects
     * @since botch-0.3
     */
    static calcLayout (viz, libSprites){
        
        const vp = viz.viewport;
        const m = viz.measures;

        const layout = {};
        

        // fictitious node, outside viewport on purpose
        const p0 = {};
        
        p0.generation = 0;
        p0.children = [];
        p0.md5 = 'parent_0';
        p0.parentId = ''; // very special case
        p0.expanded = true;
        p0.visible = false;
        p0.x = 0;
        p0.y = vp.height + m.deltah + (m.nodeh / 2);
        p0.xoff = p0.x - (m.nodew / 2);
        p0.yoff = p0.y - (m.nodeh / 2);
        layout.parent_0 = p0;

        if (!libSprites){
            return;
        }

        for (const libSprite of libSprites){

            if (!(libSprite.md5 in layout)){
                layout[libSprite.md5] = {
                    children: []
                };
            }
            const laySprite = layout[libSprite.md5];

            for (const key in libSprite){
                laySprite[key] = libSprite[key];
            }

            if (!libSprite.parentId){ // for copy-pasted default scratch sprites
                laySprite.parentId = 'parent_0';
            }
                                    
            if (!(laySprite.parentId in layout)){
                layout[laySprite.parentId] = {
                    children: []
                };
            }
            layout[laySprite.parentId].children.push(laySprite);
        }
                        

        const queue = [p0];
        let genNum = 0;
        
        let generation = [[]];
        const generations = [];
        let curParentId = '';

        while (queue.length > 0){
            const node = queue.shift();
            for (const child of node.children){
                queue.push(child);
                child.visible = true;
                child.generation = node.generation + 1;
            }

            if (node.generation > genNum){
                generations.push(generation);
                generation = [[node]];
            } else if (node.parentId === curParentId){
                generation[generation.length - 1].push(node);
            } else {
                generation.push([node]);
            }

            if (queue.length === 0){
                generations.push(generation);
            }
            genNum = node.generation;
            curParentId = node.parentId;
            
        }

        for (let i = 0; i < generations.length; i++){
            BotchDebugTab.updateFrontierLayout(viz, layout, generations[i], i);
        }
                
        BOTCH.debugLayout = layout;
        return layout;
    }
    /**
     * Given a name and a list of existing names, if name is in the list
     * generates a new name appending numbers to it.
     *
     * @param {string} name name to test
     * @param {Set<string>} names a set of existing names.
     * @returns {string} the new candidate name
     * @since botch-0.2
     */
    static findNewName (name, names){
        let candidate = name;
        let i = 1;
        while (names.has(candidate)) {
            const last = candidate[candidate.length - 1];
            
            if (last >= '0' && last < '9' && i < 10){
                candidate = candidate.slice(0, candidate.length - 1) + i;
                i += 1;
            } else {
                i = 1;
                const n = (last >= '0' && last <= '9') ? '0' : ' 1';
                candidate = `${candidate}${n}`;
            }
        }
        
        return candidate;
    }
    

    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelect',
            'updateSprites',
            'handleTreeDragStart',
            'handleTreeDragMove',
            'handleTreeDragStop',
            'handleTreeWheel'
        ]);

        const viz = {};
        const vp = { // occupied screen
            width: 500,
            height: 650};

        viz.viewport = vp;
    
        viz.viewBox = {
            x: -vp.width / 2,
            y: 0,
            width: vp.width,
            height: vp.height
        };

        viz.measures = {
            deltah: 15,
            deltaw: 25,
            nodeh: 150,
            nodew: 100
        };

        viz.isPointerDown = false;
        viz.pointerOrigin = null;
        viz.zoom = 1.0;
        const m = viz.measures;
        
        m.levh = (m.deltah * 2) + m.nodeh;

        this.state = {
            libSprites: [],
            layout: {},
            viz: viz};
    }

    componentDidMount () {
        log.log('Botch: botch-debug-tab ComponentDidMount');
        this.updateSprites();
        this.props.vm.on('BOTCH_STORAGE_HELPER_UPDATE', this.updateSprites);
    }
    componentWillUnmount () {
        log.log('Botch: botch-debug-tab ComponentWillUnmount');
        this.props.vm.removeListener('BOTCH_STORAGE_HELPER_UPDATE', this.updateSprites);
    }
    

    updateSprites (){
                
        if (!window.BOTCH){
            log.error('Botch extension is not loaded !');
            return;
        }
        
        // log.log('this=', this);
        BOTCH.loadLibrarySprites().then(libSprites => {
            const names = new Set();
            for (const libSprite of libSprites){
                const candidate = BotchDebugTab.findNewName(libSprite.name, names);
                libSprite.name = candidate;
                libSprite.json.name = candidate;
                libSprite.json.objName = candidate;
                names.add(candidate);
            }
            this.setState({
                libSprites: libSprites,
                layout: BotchDebugTab.calcLayout(this.state.viz, libSprites)});
        });

    }


    getTags (){
        if (!window.BOTCH){
            log.error('Botch extension is not loaded !');
            return;
        }
        return BOTCH.storageHelper.getAllTags();
    }

    handleSelect (index){
        // TO DO DOES NOT SHOW ANYTHING !
        log.log(`Selected tab: ${index}`);
    }

    /**
     * @param {object} event mouse event
     * @since botch-0.3
     */
    handleTreeDragStart (event){
        
        const newViz = {...this.state.viz};
        newViz.isPointerDown = true;
        newViz.pointerOrigin = BotchDebugTab.getPointFromEvent(event);

        this.setState({
            viz: newViz
        });
        
    }

    /**
     *
     * @param {*} event mouse event
     * @since botch-0.3
     */
    handleTreeDragMove (event){
        // Only run this function if the pointer is down
        if (!this.state.viz.isPointerDown) {
            return;
        }
        // Prevents user to do a selection on the page
        event.preventDefault();
      
        // Get the pointer position as an SVG Point
        const pointerPosition = BotchDebugTab.getPointFromEvent(event);
      
        // Update the viewBox variable with the distance from origin and current position
        // We don't need to take care of a ratio because this is handled in the getPointFromEvent function
        const oldViz = this.state.viz;
        const oldViewBox = oldViz.viewBox;
        const newViewBox = {
            x: oldViewBox.x - (pointerPosition.x - oldViz.pointerOrigin.x),
            y: oldViewBox.y - (pointerPosition.y - oldViz.pointerOrigin.y),
            height: oldViewBox.height,
            width: oldViewBox.width
        };
        const newViz = {...oldViz};
        newViz.viewBox = newViewBox;

        this.setState({
            viz: newViz
        });
    }

    /**
     * @since botch-0.3
     */
    handleTreeDragStop (){
        const newViz = {...this.state.viz};
        newViz.isPointerDown = false;
        this.setState({
            viz: newViz
        });
    }

    /**
     * Sets new zoomed viewbox
     * @param {int} factor zoom factor
     * @param {{x:int,y:int}} p current mouse pointer
     * @since botch-3.0
     */
    zoom (factor, p) {
        const oldViz = this.state.viz;
        const newViz = {...this.state.viz};
        newViz.zoom = oldViz.zoom * factor;
        const oldViewBox = oldViz.viewBox;
        const newViewBox = {...oldViewBox};
        newViewBox.width = oldViewBox.width * factor;
        newViewBox.height = oldViewBox.height * factor;
        newViewBox.x = (oldViewBox.x * factor) + (p.x - (p.x * factor));
        newViewBox.y = (oldViewBox.y * factor) + (p.y - (p.y * factor));
        newViz.viewBox = newViewBox;
        this.setState({
            viz: newViz
        });
    }

    /**
     * Manages zooming by wheel
     * @param {object} event mouse event
     * @since botch-0.3
     */
    handleTreeWheel (event) {
        const p = BotchDebugTab.getPointFromEvent(event);
        if (event.deltaY > 0) {
            this.zoom(1.05, p);
        } else {
            this.zoom(0.95, p);
        }
    }

    handleItemSelect (item) {
        // Randomize position of library sprite
        randomizeSpritePosition(item);
        this.props.vm.addSprite(JSON.stringify(item.json)).then(() => {
            log.log('Botch: should I do something now ?');
            // this.props.onActivateBlocksTab();
        });
    }

    requestClose (){
        log.log('Should I do something on close ?');
    }


    render () {
        
        return (<BotchLifeTree
            layout={this.state.layout}
            viz={this.state.viz}
            id="botchLifeTree"
            tags={this.getTags()}
            title={this.props.intl.formatMessage(messages.libraryTitle)}
            onItemSelected={this.handleItemSelect}
            onMouseDown={this.handleTreeDragStart}
            onMouseMove={this.handleTreeDragMove}
            onMouseUp={this.handleTreeDragStop}
            onWheel={this.handleTreeWheel}
            
        />);
        
    }
}


BotchDebugTab.propTypes = {
    dispatchUpdateRestore: PropTypes.func,
    intl: intlShape.isRequired,
            
    stage: PropTypes.shape({
        sounds: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired
        }))
    }),
    vm: PropTypes.instanceOf(VM).isRequired
};

// https://react-redux.js.org/using-react-redux/connect-mapstate

const mapStateToProps = state => ({
    editingTarget: state.scratchGui.targets.editingTarget,
    isRtl: state.locales.isRtl,
    sprites: state.scratchGui.targets.sprites,
    stage: state.scratchGui.targets.stage
});

const mapDispatchToProps = dispatch => ({
    onActivateCostumesTab: () => dispatch(activateTab(COSTUMES_TAB_INDEX)),

    dispatchUpdateRestore: restoreState => {
        dispatch(setRestore(restoreState));
    },
    onCloseImporting: () => dispatch(closeAlertWithId('importingAsset')),
    onShowImporting: () => dispatch(showStandardAlert('importingAsset'))
});

// export default injectIntl(SpriteLibrary);

export default errorBoundaryHOC('BotchDebug Tab')(
    injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps
    )(BotchDebugTab))
);
