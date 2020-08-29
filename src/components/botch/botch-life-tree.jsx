import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import Divider from '../divider/divider.jsx';
import Filter from '../filter/filter.jsx';
import TagButton from '../../containers/tag-button.jsx';
import Spinner from '../spinner/spinner.jsx';

import styles from './botch-life-tree.css';
import BotchLifeTreeItem from './botch-life-tree-item.jsx';
import log from '../../lib/log.js';

const messages = defineMessages({
    filterPlaceholder: {
        id: 'gui.library.filterPlaceholder',
        defaultMessage: 'Search',
        description: 'Placeholder text for library search field'
    },
    allTag: {
        id: 'gui.library.allTag',
        defaultMessage: 'All',
        description: 'Label for library tag to revert to all items after filtering by tag.'
    }
});

const ALL_TAG = {tag: 'all', intlLabel: messages.allTag};
const tagListPrefix = [ALL_TAG];


class BotchLifeTree extends React.Component {

    
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClose',
            'handleFilterChange',
            'handleFilterClear',
            'handleMouseEnter',
            'handleMouseLeave',
            'handlePlayingEnd',
            'handleSelect',
            'handleTagClick',
            'setFilteredDataRef',
            'handleOnMouseDown',
            'handleOnMouseUp',
            'handleOnMouseMove',
            'handleOnWheel'
        ]);
        log.log('Botch props=', props);
        this.state = {
            playingItem: null,
            filterQuery: '',
            selectedTag: ALL_TAG.tag,
            loaded: false
        };
    }
    componentDidMount () {
        // Allow the spinner to display before loading the content
        setTimeout(() => {
            this.setState({loaded: true});
            
        });
        if (this.props.setStopHandler) this.props.setStopHandler(this.handlePlayingEnd);
    }
    componentDidUpdate (prevProps, prevState) {
        if (prevState.filterQuery !== this.state.filterQuery ||
            prevState.selectedTag !== this.state.selectedTag) {
            this.scrollToTop();
        }
    }

    /**
     * @param {object}  event mouse event
     * @since botch-0.3
     */
    handleOnMouseDown (event){
        this.props.onMouseDown(event);
    }

    /**
     * @param {object}  event mouse event
     * @since botch-0.3
     */
    handleOnMouseMove (event){
        this.props.onMouseMove(event);
    }

    /**
     * @param {object}  event mouse event
     * @since botch-0.3
     */
    handleOnMouseUp (event){
        this.props.onMouseUp(event);
    }

    /**
     * @param {object}  event mouse event
     * @since botch-0.3
     */
    handleOnWheel (event){
        this.props.onWheel(event);
    }

    handleSelect (id) {
        this.handleClose();
        this.props.onItemSelected(this.getFilteredLayout()[id]);
    }
    handleClose () {
        
    }
    handleTagClick (tag) {
        if (this.state.playingItem === null) {
            this.setState({
                filterQuery: '',
                selectedTag: tag.toLowerCase()
            });
        } else {
            this.props.onItemMouseLeave(this.getFilteredLayout()[this.state.playingItem]);
            this.setState({
                filterQuery: '',
                playingItem: null,
                selectedTag: tag.toLowerCase()
            });
        }
    }
    handleMouseEnter (id) {
        // don't restart if mouse over already playing item
        if (this.props.onItemMouseEnter && this.state.playingItem !== id) {
            this.props.onItemMouseEnter(this.getFilteredLayout()[id]);
            this.setState({
                playingItem: id
            });
        }
    }
    handleMouseLeave (id) {
        if (this.props.onItemMouseLeave) {
            this.props.onItemMouseLeave(this.getFilteredLayout()[id]);
            this.setState({
                playingItem: null
            });
        }
    }
    handlePlayingEnd () {
        if (this.state.playingItem !== null) {
            this.setState({
                playingItem: null
            });
        }
    }
    handleFilterChange (event) {
        if (this.state.playingItem === null) {
            this.setState({
                filterQuery: event.target.value,
                selectedTag: ALL_TAG.tag
            });
        } else {
            this.props.onItemMouseLeave(this.getFilteredLayout()[this.state.playingItem]);
            this.setState({
                filterQuery: event.target.value,
                playingItem: null,
                selectedTag: ALL_TAG.tag
            });
        }
    }
    handleFilterClear () {
        this.setState({filterQuery: ''});
    }
    getFilteredLayout () {
        log.log('Botch TODO, not actually filtering anything !');
        return this.props.layout;
        /*
        if (this.state.selectedTag === 'all') {
            if (!this.state.filterQuery) {
                return this.props.data;
            }
            return this.props.data.filter(dataItem => (
                (dataItem.tags || [])
                    // Second argument to map sets `this`
                    .map(String.prototype.toLowerCase.call, String.prototype.toLowerCase)
                    .concat(dataItem.name ?
                        (typeof dataItem.name === 'string' ?
                        // Use the name if it is a string, else use formatMessage to get the translated name
                            dataItem.name : this.props.intl.formatMessage(dataItem.name.props)
                        ).toLowerCase() :
                        null)
                    .join('\n') // unlikely to partially match newlines
                    .indexOf(this.state.filterQuery.toLowerCase()) !== -1
            ));
        }
        return this.props.data.filter(dataItem => (
            dataItem.tags &&
            dataItem.tags
                .map(String.prototype.toLowerCase.call, String.prototype.toLowerCase)
                .indexOf(this.state.selectedTag) !== -1
        ));
        */
    }
    
    scrollToTop () {
        this.filteredDataRef.scrollTop = 0;
    }
    setFilteredDataRef (ref) {
        this.filteredDataRef = ref;
    }

    /**
     * @returns {string} a string for svg param
     * @since botch-0.3
     */
    getViewBox (){
        const vb = this.props.viz.viewBox;
        return [vb.x, vb.y, vb.width, vb.height].join(' ');
    }

    /**
     * @returns {object} the rendered tree
     * @since botch-0.3
     */
    renderTree (){
        
        const connectorStyle = {
            'stroke': 'brown',
            'stroke-width': '10px'};

        const vp = this.props.viz.viewport;
        const m = this.props.viz.measures;
        
        const fl = this.getFilteredLayout();
        
        return (
            <svg
                width={vp.width}
                height={vp.height}
                viewBox={this.getViewBox()}
                onMouseDown={this.handleOnMouseDown}
                onMouseMove={this.handleOnMouseMove}
                onMouseUp={this.handleOnMouseUp}
                onTouchStart={this.handleOnMouseDown}
                onTouchMove={this.handleOnMouseMove}
                onTouchEnd={this.handleOnMouseUp}
                onWheel={this.handleOnWheel}
                style={{border: '1px', red: 'solid'}}
            >
                {Object.keys(fl).filter(key => fl[key].generation > 1)
                    .map(key => (
                
                        <path
                            
                            d={`M ${fl[key].x} ${fl[key].y + (m.nodeh / 2) - 10} L ${fl[fl[key].parentId].x} ${fl[fl[key].parentId].y - (m.nodeh / 2) + 10}`}
                            style={connectorStyle}
                            key={typeof fl[key].name === 'string' ? `p${fl[key].name}` : `p${fl[key].rawURL}`}
                        />
                    ))}
                {Object.keys(fl).filter(key => key !== 'parent_0')
                    .map(key => (
                    
                        <g
                            
                            key={typeof fl[key].name === 'string' ? fl[key].name : fl[key].rawURL}
                        >

                            <foreignObject
                                transform={`translate(${fl[key].xoff},${fl[key].yoff})`}
                                width={m.nodew}
                                height={m.nodeh}
                            >
                                {this.renderTreeItem(fl[key])}
                            </foreignObject>
                            
                        </g>
                        
                    ))}
            </svg>
        );
    }

    /**
     * @returns {object} the rendered TreeContainer
     * @since botch-0.3
     */
    renderTreeContainer (){
        const LOADED = this.renderTree();

        return (<div
            className={classNames(styles.libraryScrollGrid, {
                [styles.withFilterBar]: this.props.filterable || this.props.tags
            })}
            ref={this.setFilteredDataRef}
        >
            {this.state.loaded ? <span>{LOADED}</span> : (
                <div className={styles.spinnerWrapper}>
                    <Spinner
                        large
                        level="primary"
                    />
                </div>
            )}
        </div>);
    }
    
    /**
     * @param {object} dataItem
     * @returns {object} the rendered TreeItem
     * @since botch-0.3
     */
    renderTreeItem (dataItem){
        return (<BotchLifeTreeItem
            bluetoothRequired={dataItem.bluetoothRequired}
            collaborator={dataItem.collaborator}
            description={dataItem.description}
            disabled={dataItem.disabled}
            extensionId={dataItem.extensionId}
            featured={dataItem.featured}
            hidden={dataItem.hidden}
            
            // Botch: our sprite md5 can be different from first costume
            // iconMd5={dataItem.md5}
            iconMd5={(dataItem.json && dataItem.json.costumes[0]) ?
                dataItem.json.costumes[0].md5ext : dataItem.md5}
            iconRawURL={dataItem.rawURL}
            icons={dataItem.json && dataItem.json.costumes}
            id={dataItem.md5}
            insetIconURL={dataItem.insetIconURL}
            internetConnectionRequired={dataItem.internetConnectionRequired}
            isPlaying={this.state.playingItem === dataItem.md5}
            name={dataItem.name}
            showPlayButton={this.props.showPlayButton}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
            onSelect={this.handleSelect}
        />);
    }

    /**
     * @returns {object} the rendered filter
     * @since botch-0.3
     */
    renderFilter (){
        return (this.props.filterable || this.props.tags) && (
            <div className={styles.filterBar}>
                {this.props.filterable && (
                    <Filter
                        className={classNames(
                            styles.filterBarItem,
                            styles.filter
                        )}
                        filterQuery={this.state.filterQuery}
                        inputClassName={styles.filterInput}
                        placeholderText={this.props.intl.formatMessage(messages.filterPlaceholder)}
                        onChange={this.handleFilterChange}
                        onClear={this.handleFilterClear}
                    />
                )}
                {this.props.filterable && this.props.tags && (
                    <Divider className={classNames(styles.filterBarItem, styles.divider)} />
                )}
                {this.props.tags &&
                    <div className={styles.tagWrapper}>
                        {tagListPrefix.concat(this.props.tags).map((tagProps, id) => (
                            <TagButton
                                active={this.state.selectedTag === tagProps.tag.toLowerCase()}
                                className={classNames(
                                    styles.filterBarItem,
                                    styles.tagButton,
                                    tagProps.className
                                )}
                                key={`tag-button-${id}`}
                                onClick={this.handleTagClick}
                                {...tagProps}
                            />
                        ))}
                    </div>
                }
            </div>
        );
    }


    render () {
        return (
        /*
        <Modal
            fullScreen
            contentLabel={this.props.title}
            id={this.props.id}
            onRequestClose={this.handleClose}
        >*/
            <div>
                {this.renderTreeContainer()}
            </div>
        );
    }
}

BotchLifeTree.propTypes = {
    layout: PropTypes.any.isRequired,
    viz: PropTypes.object.isRequired,
    filterable: PropTypes.bool,
    id: PropTypes.string.isRequired,
    intl: intlShape.isRequired,
    onMouseDown: PropTypes.func,
    onMouseUp: PropTypes.func,
    onMouseMove: PropTypes.func,
    onWheel: PropTypes.func,
    onItemMouseEnter: PropTypes.func,
    onItemMouseLeave: PropTypes.func,
    onItemSelected: PropTypes.func,
    setStopHandler: PropTypes.func,
    showPlayButton: PropTypes.bool,
    tags: PropTypes.arrayOf(PropTypes.shape(TagButton.propTypes)),
    title: PropTypes.string.isRequired
};

BotchLifeTree.defaultProps = {
    filterable: true,
    showPlayButton: false
};

export default injectIntl(BotchLifeTree);
