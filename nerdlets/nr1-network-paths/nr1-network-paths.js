import React from 'react';
import { NerdGraphQuery, PlatformStateContext } from 'nr1';
import HearderCharts from './header-charts';
import { getQueryTime, tidyNumber } from './utils';
import DropDowns from './drop-downs';
import HostRow from './host-row';

// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

let hostQuery = '';
let entityQuery = '';

export default class NetworkPaths extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      reachableWhere: '',
      orderBy: ' ORDER BY rtt DESC ',
      protocolWhere: '',
      storeWhere: props.entityGuid ? ` WHERE entity.guid = '${props.entityGuid}' ` : '',
      hostWhere: '',
    };
  }

  setStoreWhere = (store) => {
    if (store === "All Stores") {
      this.setState({ storeWhere: '' });
    }
    else {
      this.setState({ storeWhere: ` WHERE entity.name = '${store}' ` });
    }
  };

  setHostWhere = (host) => {
    if (host === "All Hosts") {
      this.setState({ hostWhere: '' });
    }
    else {
      this.setState({ hostWhere: ` WHERE target_host = '${host}' ` });
    }
  }

  setProtocolWhere = (where) => { this.setState({ protocolWhere: where }) };
  setReachableWhere = (where) => (this.setState({ reachableWhere: where }));
  setOrderBy = (order) => (this.setState({ orderBy: order }));

  render() {
    const variables = { id: this.props.accountId };

    return (
      <PlatformStateContext.Consumer>
        {(platformState) => {
          return (
            entityQuery = `query($id: Int!) {
              actor {
                nrql(
                  accounts: $id
                  query: " SELECT hop_count, packet_loss, unreachable, jitter, rtt, target_host, protocol, port, entity_name FROM (\
                  FROM Log \
                  SELECT average(hop_count) as 'hop_count', sum(packet_loss) OR 0 as 'packet_loss', \
                   percentage(count(*), WHERE NOT is_destination_reachable) OR 0 as 'unreachable', \
                   average(jitter) OR 0 as 'jitter', average(rtt) OR 0 as 'rtt' \
                  WHERE hop_count IS NOT NULL ${this.state.storeWhere} \
                  FACET entity.name as entity_name LIMIT MAX) ${this.state.orderBy} \
                  ${getQueryTime(platformState.timeRange)} LIMIT 5"
                ) {
                  results
                }}}`,
            <>
              <HearderCharts
                accountId={this.props.accountId}
                storeWhere={this.state.storeWhere}
                reachableWhere={this.state.reachableWhere}
                protocolWhere={this.state.protocolWhere}
                hostWhere={this.state.hostWhere}
              />
              <DropDowns
                accountId={this.props.accountId}
                setProtocolWhere={this.setProtocolWhere}
                setReachableWhere={this.setReachableWhere}
                setOrderBy={this.setOrderBy}
                setStoreWhere={this.setStoreWhere}
                storeName={this.props.entityName}
                storeWhere={this.state.storeWhere}
                setHostWhere={this.setHostWhere}
              />
              <NerdGraphQuery
                pollInterval={NerdGraphQuery.AUTO_POLL_INTERVAL}
                query={entityQuery}
                variables={variables}
              >
                {({ data, loading, error }) => {
                  if (loading) {
                    return <div>Loading...</div>;
                  }

                  if (error) {
                    return <div>Error: {error.message}</div>;
                  }

                  return (
                    <div>
                      <table>
                        <thead>
                          <tr>
                            <th>Location</th>
                            <th>Hops</th>
                            <th>Packet Loss</th>
                            <th>% Unreachable</th>
                            <th>Jitter</th>
                            <th>RTT</th>
                            <th>Path</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.actor.nrql && data.actor.nrql.results && data.actor.nrql.results.length > 0 ? data.actor.nrql.results.map((row, index) => (
                            hostQuery = `query($id: Int!) {
                      actor {
                        nrql(
                          accounts: $id
                          query: "SELECT hop_count, test_count, max_timestamp, min_timestamp, packet_loss, unreachable, jitter, rtt, target_host, protocol, port FROM ( \
                          FROM Log SELECT count(*) as 'test_count', max(timestamp) as 'max_timestamp', min(timestamp) as 'min_timestamp', \
                          average(hop_count) as 'hop_count', sum(packet_loss) OR 0 as 'packet_loss', \
                          percentage(count(*), WHERE NOT is_destination_reachable) OR 0 as 'unreachable', average(jitter) OR 0 as 'jitter', average(rtt) OR 0 as 'rtt' \
                          WHERE hop_count IS NOT NULL AND entity.name = '${row['entity_name']}' ${this.state.protocolWhere} ${this.state.hostWhere} \
                          FACET target_host, protocol, port LIMIT MAX) \
                          ${this.state.orderBy} ${getQueryTime(platformState.timeRange)}"
                     ) {results}}}`, console.log(hostQuery),
                            <>
                              <tr key={index}>
                                <td className='store-name'>{row['entity_name']}</td>
                                <td>{tidyNumber(row['hop_count'])}</td>
                                <td>{row['packet_loss']}</td>
                                <td>{tidyNumber(row['unreachable'])}</td>
                                <td>{tidyNumber(row['jitter'])}</td>
                                <td>{tidyNumber(row['rtt'])}</td>
                              </tr>
                              <NerdGraphQuery
                                pollInterval={NerdGraphQuery.AUTO_POLL_INTERVAL}
                                query={hostQuery}
                                variables={variables}
                              >
                                {({ data, loading, error }) => {
                                  if (loading) {
                                    return <div>Loading...</div>;
                                  }

                                  if (error) {
                                    return <div>Error: {error.message}</div>;
                                  }

                                  return (
                                    <>
                                      {data.actor.nrql && data.actor.nrql.results && data.actor.nrql.results.length > 0 ? data.actor.nrql.results.map((hostRow, hostIndex) => (
                                        <HostRow
                                          accountId={this.props.accountId}
                                          hostIndex={hostIndex}
                                          storeName={row['entity_name']}
                                          targetHost={hostRow['target_host']}
                                          protocol={hostRow['protocol']}
                                          port={hostRow['port']}
                                          reachableWhere={this.state.reachableWhere}
                                          hopCount={hostRow['hop_count']}
                                          packetLoss={hostRow['packet_loss']}
                                          unreachable={hostRow['unreachable']}
                                          jitter={hostRow['jitter']}
                                          rtt={hostRow['rtt']}
                                          testCount={hostRow['test_count']}
                                          maxTimestamp={hostRow['max_timestamp']}
                                          minTimestamp={hostRow['min_timestamp']}
                                          timeZone={this.props.timeZone}
                                        />
                                      )) : <td style={{ paddingLeft: '30px' }}>No hosts found.</td>}
                                    </>
                                  );
                                }}
                              </NerdGraphQuery>
                            </>
                          )) : <td style={{ paddingLeft: '30px' }}>No data found.</td>}
                        </tbody>
                      </table>
                    </div>
                  );
                }}
              </NerdGraphQuery>
            </>)
        }}
      </PlatformStateContext.Consumer>);
  }
}
