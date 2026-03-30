import React from 'react';
import { NerdGraphQuery, Dropdown, DropdownItem, PlatformStateContext } from 'nr1';
import { getQueryTime } from './utils';

export default class HostDropDown extends React.Component {
    allHosts = "All Hosts";
    HostDropDownQuery = '';
    variables = {};

    constructor(props) {
        super(props);
        this.variables = { id: props.accountId };

        this.state = {
            selectedHost: this.allHosts,
            search: '',
        };
    };

    itemSelected = (item) => {
        //console.log(item);
        this.setState({ selectedHost: item });
        this.props.setHostWhere(item);
    };

    renderDropdown = (queryResult) => {
        //console.log(queryResult.actor.nrql.results[0].host);
        let results = [];
        if (queryResult.actor && queryResult.actor.nrql && queryResult.actor.nrql.results && queryResult.actor.nrql.results[0].host) {
            results = queryResult.actor.nrql.results[0].host;
            if (results[0] != this.allHosts) {
                results.sort();
                results.unshift(this.allHosts);
            }
        }
        else {
            results.push("No target hosts found");
        }
        const filteredItems = results.filter((item) => item.toLowerCase().includes(this.state.search.toLowerCase()));

        return (
            <Dropdown
                iconType={Dropdown.ICON_TYPE.HARDWARE_AND_SOFTWARE__HARDWARE__SERVER__S_OK}
                title={this.state.selectedHost}
                items={filteredItems}
                rowCount={filteredItems.length}
                search={this.state.search}
                onSearch={(evt) => this.setState({ search: evt.target.value })}
                className='flex-item'
            >
                {({ item, index }) => (
                    <DropdownItem key={index} onClick={() => this.itemSelected(item)}>{item}</DropdownItem>
                )}
            </Dropdown>
        );
    };

    render() {
        return (
            <PlatformStateContext.Consumer>
                {(platformState) => {
                    return (
                        this.HostDropDownQuery = `query($id: Int!) {
                            actor {
                                nrql(
                                    accounts: $id,
                                    query: "FROM Log SELECT uniques(target_host) as host WHERE hop_count IS NOT NULL ${this.props.storeWhere} limit max ${getQueryTime(platformState.timeRange)}"
                                ) {
                                    results
                            }}}`,
                        <NerdGraphQuery
                            pollInterval={NerdGraphQuery.AUTO_POLL_INTERVAL}
                            query={this.HostDropDownQuery}
                            variables={this.variables}
                        >
                            {({ data, loading, error }) => {
                                if (loading) {
                                    return <Dropdown title={this.state.selectedHost} className='flex-item' iconType={Dropdown.ICON_TYPE.HARDWARE_AND_SOFTWARE__HARDWARE__SERVER__S_OK}><DropdownItem>Loading...</DropdownItem></Dropdown>;
                                }

                                if (error) {
                                    return <Dropdown title={this.state.selectedHost} className='flex-item' iconType={Dropdown.ICON_TYPE.HARDWARE_AND_SOFTWARE__HARDWARE__SERVER__S_ERROR}><DropdownItem>Error: {error.message}</DropdownItem></Dropdown>;
                                }

                                return (
                                    <div>{this.renderDropdown(data)}</div>
                                );
                            }}
                        </NerdGraphQuery>
                    )
                }}
            </PlatformStateContext.Consumer>
        )
    }
}
