import React from 'react';
import { NerdGraphQuery, Dropdown, DropdownItem, PlatformStateContext } from 'nr1';
import { getQueryTime } from './utils';

export default class StoreDropDown extends React.Component {
    allStores = "All Stores";
    storeDropDownQuery = '';
    variables = {};

    constructor(props) {
        super(props);
        this.variables = { id: props.accountId };

        this.state = {
            selectedStore: this.props.storeName ? this.props.storeName : this.allStores,
            search: '',
        }
    };

    itemSelected = (item) => {
        //console.log(item);
        this.setState({ selectedStore: item });
        this.props.setStoreWhere(item);
    };

    renderDropdown = (queryResult) => {
        //console.log(queryResult.actor.nrql.results[0].store);
        let results = [];
        if (queryResult.actor && queryResult.actor.nrql && queryResult.actor.nrql.results && queryResult.actor.nrql.results[0].store) {
            results = queryResult.actor.nrql.results[0].store;
            if (results[0] != this.allStores) {
                results.sort();
                results.unshift(this.allStores);
            }
        }
        else {
            results.push("No stores found");
        }
        const filteredItems = results.filter((item) => item.toLowerCase().includes(this.state.search.toLowerCase()));

        return (
            <Dropdown
                iconType={Dropdown.ICON_TYPE.LOCATION__LOCATION__HOME}
                title={this.state.selectedStore}
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
                    //console.log(platformState);
                    return (
                        this.storeDropDownQuery = `query($id: Int!) {
                            actor {
                                nrql(
                                    accounts: $id,
                                    query: "FROM Log SELECT uniques(entity.name) as store WHERE hop_count IS NOT NULL limit max ${getQueryTime(platformState.timeRange)}"
                                ) {
                                    results
                            }}}`,
                        <NerdGraphQuery
                            pollInterval={NerdGraphQuery.AUTO_POLL_INTERVAL}
                            query={this.storeDropDownQuery}
                            variables={this.variables}
                        >
                            {({ data, loading, error }) => {
                                if (loading) {
                                    return <Dropdown title={this.state.selectedStore} className='flex-item' iconType={Dropdown.ICON_TYPE.LOCATION__LOCATION__HOME}><DropdownItem>Loading...</DropdownItem></Dropdown>;
                                }

                                if (error) {
                                    return <Dropdown title={this.state.selectedStore} className='flex-item' iconType={Dropdown.ICON_TYPE.LOCATION__LOCATION__HOME}><DropdownItem>Error: {error.message}</DropdownItem></Dropdown>;
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
