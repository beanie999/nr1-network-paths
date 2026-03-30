import React from 'react';
import { NerdletStateContext, EntityByGuidQuery, Spinner, StackItem, SectionMessage, AccountsQuery, Dropdown, DropdownItem, NerdGraphQuery } from 'nr1';
import NetworkPaths from './nr1-network-paths';

/*
  Main parent class, checks for an entity guid and calls the main class (AttributeExplorer).
  If no entity guid is found then asks the user to launch the app from within an APM or OTEL service.
*/
export default class AttributeExplorerNerdlet extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            accountId: null,
            timeZone: 'UTC',
        };
        this.getTimeZone();
    }

    getTimeZone() {
        const userQuery = `
        query {
            actor {
                user {
                    timeZoneName
                }
            }
        }`;

        NerdGraphQuery.query({ query: userQuery }).then((result) => {
            if (result.error) {
                console.log('Error fetching user timezone: ' + result.error);
            }
            else {
                //console.log('User timezone: ' + result.data.actor.user.timeZoneName);
                this.setState({ timeZone: result.data.actor.user.timeZoneName });
            }
        });
    }

    // Method to get and return the entity guid from the nerdlet state.
    getEntityGuid(nerd) {
        if (nerd.hasOwnProperty('entityGuid')) {
            //console.log(nerd);
            return nerd.entityGuid;
        }
        else {
            return null;
        }
    }

    // Renders a spinner while getting the nerdlet state. Once we have the state
    // returns an error, info message or main worker class (AttributeExplorer).
    render() {
        return (
            <NerdletStateContext.Consumer>
                {(nerdletState) =>
                    <EntityByGuidQuery entityGuid={this.getEntityGuid(nerdletState)}>
                        {({ loading, error, data }) => {
                            if (loading) {
                                return <Spinner />;
                            }

                            if (error) {
                                return (
                                    <StackItem>
                                        <SectionMessage
                                            type={SectionMessage.TYPE.CRITICAL}
                                            title="Error in lauching the app."
                                            description={error.message}
                                        />
                                    </StackItem>
                                );
                            }

                            if (data.entities.length === 0 && !this.state.accountId) {
                                return (
                                    <AccountsQuery>
                                        {({ loading, error, data }) => {
                                            if (loading) {
                                                return <Spinner />;
                                            }

                                            if (error) {
                                                return 'Error!';
                                            }

                                            return (
                                                <Dropdown title="Select Account" items={data} rowHeight={20}>
                                                    {({ item }) => (
                                                        <DropdownItem key={item.id} onClick={() => {
                                                            this.setState({ accountId: item.id });
                                                        }}>
                                                            {item.id} - {item.name}
                                                        </DropdownItem>
                                                    )}
                                                </Dropdown>
                                            );
                                        }}
                                    </AccountsQuery>
                                );
                            }
                            else if (data.entities.length === 0 && this.state.accountId) {
                                return (
                                    <NetworkPaths
                                        accountId={this.state.accountId}
                                    />
                                );
                            }

                            return (
                                <NetworkPaths
                                    entityGuid={this.getEntityGuid(nerdletState)}
                                    entityName={data.entities[0].name}
                                    accountId={data.entities[0].accountId}
                                    domain={data.entities[0].domain}
                                    type={data.entities[0].type}
                                    timeZone={this.state.timeZone}
                                />
                            );
                        }}
                    </EntityByGuidQuery>
                }
            </NerdletStateContext.Consumer>
        );
    }
}
