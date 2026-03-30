import React from 'react';
import { Dropdown, DropdownItem, Layout, LayoutItem } from 'nr1';
import StoreDropDown from './store-drop-down';
import HostDropDown from './host-drop-down';

export default class DropDowns extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            protocol: 'All',
            reachable: 'All',
            order: 'Rtt',
        }
    };

    render() {
        return (
            <Layout className='flex-container'>
                <LayoutItem className='flex-item'>
                    <span className='flex-item'>Store:</span>
                    <StoreDropDown accountId={this.props.accountId} setStoreWhere={this.props.setStoreWhere} storeName={this.props.storeName} />
                    <span className='flex-item'>Host:</span>
                    <HostDropDown accountId={this.props.accountId} storeWhere={this.props.storeWhere} setHostWhere={this.props.setHostWhere} />
                    <span className='flex-item'> Protocol:</span>
                    <Dropdown iconType={Dropdown.ICON_TYPE.INTERFACE__ARROW__ARROW_RIGHT__V_ALTERNATE} title={this.state.protocol} className='flex-item'>
                        <DropdownItem onClick={() => (this.props.setProtocolWhere(''), this.setState({ protocol: 'All' }))}>All</DropdownItem>
                        <DropdownItem onClick={() => (this.props.setProtocolWhere(' WHERE protocol = \'icmp\' '), this.setState({ protocol: 'icmp' }))}>icmp</DropdownItem>
                        <DropdownItem onClick={() => (this.props.setProtocolWhere(' WHERE protocol = \'tcp\' '), this.setState({ protocol: 'tcp' }))}>tcp</DropdownItem>
                    </Dropdown>
                    <span className='flex-item'> Is reachable:</span>
                    <Dropdown iconType={Dropdown.ICON_TYPE.HARDWARE_AND_SOFTWARE__HARDWARE__NETWORK__S_ERROR} title={this.state.reachable} className='flex-item'>
                        <DropdownItem onClick={() => (this.props.setReachableWhere(''), this.setState({ reachable: 'All' }))}>All</DropdownItem>
                        <DropdownItem onClick={() => (this.props.setReachableWhere(' WHERE NOT is_destination_reachable '), this.setState({ reachable: 'No' }))}>No</DropdownItem>
                        <DropdownItem onClick={() => (this.props.setReachableWhere(' WHERE is_destination_reachable '), this.setState({ reachable: 'Yes' }))}>Yes</DropdownItem>
                    </Dropdown>
                    <span className='flex-item'> Order by:</span>
                    <Dropdown iconType={Dropdown.ICON_TYPE.INTERFACE__ARROW__SORT} title={this.state.order} className='flex-item'>
                        <DropdownItem onClick={() => (this.props.setOrderBy(' ORDER BY hop_count DESC '), this.setState({ order: 'Hop Count' }))}>Hop Count</DropdownItem>
                        <DropdownItem onClick={() => (this.props.setOrderBy(' ORDER BY jitter DESC '), this.setState({ order: 'Jitter' }))}>Jitter</DropdownItem>
                        <DropdownItem onClick={() => (this.props.setOrderBy(' ORDER BY packet_loss DESC '), this.setState({ order: 'Packet Loss' }))}>Packet Loss</DropdownItem>
                        <DropdownItem onClick={() => (this.props.setOrderBy(' ORDER BY rtt DESC '), this.setState({ order: 'Rtt' }))}>Rtt</DropdownItem>
                        <DropdownItem onClick={() => (this.props.setOrderBy(' ORDER BY unreachable DESC '), this.setState({ order: 'Unreachable Count' }))}>Unreachable Count</DropdownItem>
                    </Dropdown>
                </LayoutItem>
            </Layout>
        )
    }
}