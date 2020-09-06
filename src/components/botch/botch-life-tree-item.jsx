import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl} from 'react-intl';
import getCostumeUrl from '../../lib/get-costume-url';
import log from '../../lib/log.js';


import LibraryItemComponent from '../../components/library-item/library-item.jsx';

class BotchLifeTreeItem extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleBlur',
            'handleClick',
            'handleFocus',
            'handleKeyPress',
            'handleMouseEnter',
            'handleMouseLeave',
            'handlePlay',
            'handleStop',
            'rotateIcon',
            'startRotatingIcons',
            'stopRotatingIcons'
        ]);
        
        this.state = {
            // iconIndex: 0,
            // TO DO Botch: we added it, but don't like this
            // https://github.com/CoderDojoTrento/botch-gui/issues/22
            iconIndex: this.props.currentCostume,
            isRotatingIcon: false
        };
        log.log('BotchLifeTreeItem state', this.state, 'props', this.props);
    }
    componentWillUnmount () {
        clearInterval(this.intervalId);
    }
    handleBlur (id) {
        this.handleMouseLeave(id);
    }
    handleClick (e) {
        if (!this.props.disabled) {
            this.props.onSelect(this.props.id);
        }
        e.preventDefault();
    }
    handleFocus (id) {
        if (!this.props.showPlayButton) {
            this.handleMouseEnter(id);
        }
    }
    handleKeyPress (e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this.props.onSelect(this.props.id);
        }
    }
    handleMouseEnter () {
        // only show hover effects on the item if not showing a play button
        if (!this.props.showPlayButton) {
            this.props.onMouseEnter(this.props.id);
            if (this.props.icons && this.props.icons.length) {
                this.stopRotatingIcons();
                this.setState({
                    // TO DO Botch: we added it, but don't like this
                    // https://github.com/CoderDojoTrento/botch-gui/issues/22
                    // isRotatingIcon: true  // disabled
                }, this.startRotatingIcons);
            }
        }
    }
    handleMouseLeave () {
        // only show hover effects on the item if not showing a play button
        if (!this.props.showPlayButton) {
            this.props.onMouseLeave(this.props.id);
            if (this.props.icons && this.props.icons.length) {
                this.setState({
                    isRotatingIcon: false
                }, this.stopRotatingIcons);
            }
        }
    }
    handlePlay () {
        this.props.onMouseEnter(this.props.id);
    }
    handleStop () {
        this.props.onMouseLeave(this.props.id);
    }
    startRotatingIcons () {
        // TO DO Botch: temporarily removed, but don't like this
        // https://github.com/CoderDojoTrento/botch-gui/issues/22
        // this.rotateIcon();
        // this.intervalId = setInterval(this.rotateIcon, 300);
    }
    stopRotatingIcons () {
        if (this.intervalId) {
            this.intervalId = clearInterval(this.intervalId);
        }
    }
    rotateIcon () {
        const nextIconIndex = (this.state.iconIndex + 1) % this.props.icons.length;
        this.setState({iconIndex: nextIconIndex});
    }
    curIconMd5 () {
        const iconMd5Prop = this.props.iconMd5;
        if (this.props.icons &&
            this.state.isRotatingIcon &&
            this.state.iconIndex < this.props.icons.length) {
            const icon = this.props.icons[this.state.iconIndex] || {};
            return icon.md5ext || // 3.0 library format
                icon.baseLayerMD5 || // 2.0 library format, TODO GH-5084
                iconMd5Prop;
        }
        return iconMd5Prop;
    }
    render () {
        
        let iconURL;
        let costume = this.props.icons[0];
        
        if (costume.asset){ // Botch: our sprites have full asset data
            if (this.props.icons &&
                // TO DO Botch: we added it, but don't like this
                // https://github.com/CoderDojoTrento/botch-gui/issues/22
                // this.state.isRotatingIcon &&
                this.state.iconIndex < this.props.icons.length){
                costume = this.props.icons[this.state.iconIndex];
            }
            iconURL = getCostumeUrl(costume.asset);
        } else { // original Scratch method, fetches from the web
            const iconMd5 = this.curIconMd5();
            iconURL = iconMd5 ?
                `https://cdn.assets.scratch.mit.edu/internalapi/asset/${iconMd5}/get/` :
                this.props.iconRawURL;
        }
        
        return (
            <LibraryItemComponent
                bluetoothRequired={this.props.bluetoothRequired}
                collaborator={this.props.collaborator}
                description={this.props.description}
                disabled={this.props.disabled}
                extensionId={this.props.extensionId}
                featured={this.props.featured}
                hidden={this.props.hidden}
                iconURL={iconURL}
                icons={this.props.icons}
                id={this.props.id}
                insetIconURL={this.props.insetIconURL}
                internetConnectionRequired={this.props.internetConnectionRequired}
                isPlaying={this.props.isPlaying}
                name={this.props.name}
                showPlayButton={this.props.showPlayButton}
                onBlur={this.handleBlur}
                onClick={this.handleClick}
                onFocus={this.handleFocus}
                onKeyPress={this.handleKeyPress}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
                onPlay={this.handlePlay}
                onStop={this.handleStop}
            />
        );
    }
}

BotchLifeTreeItem.propTypes = {
    bluetoothRequired: PropTypes.bool,
    collaborator: PropTypes.string,
    description: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node
    ]),
    disabled: PropTypes.bool,
    extensionId: PropTypes.string,
    featured: PropTypes.bool,
    hidden: PropTypes.bool,

    iconMd5: PropTypes.string,
    iconRawURL: PropTypes.string,
    // TO DO Botch: we added it, but don't like this, right costume should be the first
    currentCostume: PropTypes.number.isRequired,
    icons: PropTypes.arrayOf(
        PropTypes.shape({
            asset: PropTypes.object, // Botch
            baseLayerMD5: PropTypes.string, // 2.0 library format, TO DO GH-5084
            md5ext: PropTypes.string // 3.0 library format
        })
    ),
    id: PropTypes.string.isRequired,
    insetIconURL: PropTypes.string,
    internetConnectionRequired: PropTypes.bool,
    isPlaying: PropTypes.bool,
    name: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node
    ]),
    onMouseEnter: PropTypes.func.isRequired,
    onMouseLeave: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    showPlayButton: PropTypes.bool
};

export default injectIntl(BotchLifeTreeItem);
