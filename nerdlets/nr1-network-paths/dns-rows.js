import React from 'react';
import { NerdGraphQuery, Tooltip } from 'nr1';
import { getFromToQueryTime, tidyNumber, getDateTime } from './utils';

export default class DnsRows extends React.Component {
    constructor(props) {
        super(props);

        this.portWhere = this.props.port ? ` WHERE port = ${this.props.port} ` : '';
        this.latestTimestamp = this.props.maxTimestamp ? this.props.maxTimestamp : 0;
        this.slowestLatency = 0;

        //console.log('Max timestamp: ' + this.props.maxTimestamp);
        //console.log('Min timestamp: ' + this.props.minTimestamp);

        this.state = {
            rows: [],
            prompt: 'Loading...',
        }
        this.getRows();
    };

    getSlowestNode(hops) {
        let maxRtt = -1;
        let slowIndex = -1;
        hops.forEach((hop, index) => {
            if (hop.rtt && hop.rtt > maxRtt) {
                maxRtt = hop.rtt;
                slowIndex = index;
            }
        });
        return slowIndex;
    };

    calculateSlowestLatency(rows) {
        this.slowestLatency = 0;
        rows.forEach((dnsRow) => {
            dnsRow.tests.forEach((hop) => {
                let rtt = hop.rtt ? hop.rtt : 0;
                if (rtt > this.slowestLatency) {
                    this.slowestLatency = rtt;
                }
            })
        });
        console.log('Slowest latency: ' + this.slowestLatency);
    };

    getRows() {
        const dnsQuery = `query($id: Int!) {
                actor {
                    nrql(
                        accounts: $id
                        query: "FROM Log SELECT timestamp, target_host, hop_count, is_destination_reachable, \
                                jitter, packet_loss, rtt, nodes, context.interface_name as interface_name, context.interface_type as interface_type, \
                                context.network_name as network_name, decode(blob(newrelic.ext.nodes), 'base64') as nodes_ext \
                            WHERE hop_count IS NOT NULL AND entity.name = '${this.props.storeName}' AND target_host = '${this.props.targetHost}' \
                                AND protocol = '${this.props.protocol}' ${this.portWhere} ${this.props.reachableWhere} ${getFromToQueryTime(this.props.minTimestamp, this.latestTimestamp)} \
                            LIMIT 5"
                            ) {results}}}`;
        //console.log(dnsQuery);
        const variables = { id: this.props.accountId };
        NerdGraphQuery.query({
            query: dnsQuery,
            variables: variables,
        }).then((result) => {
            if (result.data.actor.nrql && result.data.actor.nrql.results && result.data.actor.nrql.results.length > 0) {
                let rows = this.state.rows.slice();
                result.data.actor.nrql.results.forEach((dnsRow) => {
                    let j = dnsRow.nodes_ext ? JSON.parse(dnsRow.nodes + dnsRow.nodes_ext) : JSON.parse(dnsRow.nodes);
                    let test = {
                        target_host: dnsRow.target_host,
                        hop_count: dnsRow.hop_count,
                        is_destination_reachable: dnsRow.is_destination_reachable,
                        jitter: dnsRow.jitter,
                        packet_loss: dnsRow.packet_loss,
                        rtt: dnsRow.rtt,
                        tests: j,
                        interface_name: dnsRow.interface_name,
                        interface_type: dnsRow.interface_type,
                        network_name: dnsRow.network_name,
                        timestamp: dnsRow.timestamp,
                    }
                    this.latestTimestamp = this.latestTimestamp === 0 || test.timestamp < this.latestTimestamp ? test.timestamp - 1000 : this.latestTimestamp;
                    //console.log(test);
                    //console.log('Latest timestamp: ' + this.latestTimestamp);
                    rows.push(test);
                });
                this.calculateSlowestLatency(rows);
                let prompt = rows.length < this.props.testCount ? `More tests: ${this.props.testCount - rows.length}` : '';
                this.setState({ rows: rows, prompt: prompt });
            }
            else {
                this.setState({ prompt: 'No tests found.' });
            }
        }).catch((error) => {
            this.setState({ prompt: 'Error: ' + error.message });
        });
    };

    networkNode(hopIndex, hop, slowIndex) {
        const hostname = hop.hostname ? 'Hostname: ' + hop.hostname + '\n' : '';
        const ip = hop.ip_address ? 'IP: ' + hop.ip_address + '\n' : '';
        const RTT = hop.rtt ? 'RTT: ' + tidyNumber(hop.rtt) + '\n' : '';
        const packet_loss = hop.packet_loss ? 'Packet Loss: ' + tidyNumber(hop.packet_loss) + '\n' : '';
        const location_country = hop.location_country ? 'Country: ' + hop.location_country + '\n' : '';
        const location_city = hop.location_city ? 'City: ' + hop.location_city + '\n' : '';
        const cloud_provider_name = hop.cloud_provider_name ? 'Cloud Provider: ' + hop.cloud_provider_name + '\n' : '';
        const white = ip || hostname ? false : true;
        let hopStart = hopIndex === 0 ? '' : ' → ';
        let hopOut = `${ip}${hostname}${RTT}${packet_loss}${location_country}${location_city}${cloud_provider_name}`;
        if (hopOut) {
            hopOut = 'Hop: ' + (hopIndex + 1) + '\n' + hopOut;
        }
        let rttValue = hop.rtt ? Math.round(hop.rtt * 20 / this.slowestLatency) : 0;
        if (!hopOut) {
            hopOut = 'No data available';
            return <>{hopStart}<Tooltip text={hopOut}>
                <span className='circle-number unknown'>{hopIndex + 1}</span>
            </Tooltip></>
        }
        else if (hopIndex === slowIndex) {
            return <>{hopStart}<Tooltip text={hopOut}>
                <span className='circle-number critical' style={{ width: rttValue, height: rttValue, backgroundColor: white ? 'white' : 'red' }}></span>
            </Tooltip></>
        }
        else {
            return <>{hopStart}<Tooltip text={hopOut}>
                <span className='circle-number normal' style={{ width: rttValue, height: rttValue, backgroundColor: white ? 'white' : 'blue' }}></span>
            </Tooltip></>
        }
    };

    render() {
        let slowIndex = -1;
        return (
            <>
                {
                    this.state.rows.map((dnsRow) => (
                        slowIndex = this.getSlowestNode(dnsRow.tests),
                        <tr>
                            <Tooltip text={dnsRow.network_name + ": " + dnsRow.interface_name + " (" + dnsRow.interface_type + ")"}><td style={{ paddingLeft: '60px' }}>{getDateTime(dnsRow.timestamp, this.props.timeZone)}</td></Tooltip>
                            <Tooltip text="Hop count"><td>{dnsRow.hop_count}</td></Tooltip>
                            <Tooltip text="Packet loss"><td>{dnsRow.packet_loss ? dnsRow.packet_loss : 'n/a'}</td></Tooltip>
                            <td className={dnsRow.is_destination_reachable ? 'good-text' : 'error-text'}>
                                {dnsRow.is_destination_reachable ? 'Reachable' : 'Unreachable'}
                            </td>
                            <Tooltip text="Jitter"><td>{dnsRow.jitter ? tidyNumber(dnsRow.jitter) : 'n/a'}</td></Tooltip>
                            <Tooltip text="RTT"><td>{dnsRow.rtt ? tidyNumber(dnsRow.rtt) : 'n/a'}</td></Tooltip>
                            <td className='flex-container'>
                                {dnsRow.tests.map((hop, hopIndex) => (
                                    <>{this.networkNode(hopIndex, hop, slowIndex)}</>
                                ))}
                            </td>
                        </tr>
                    ))
                }
                {this.props.testCount > this.state.rows.length ? <tr><td style={{ paddingLeft: '60px', cursor: 'pointer' }} onClick={() => this.getRows()}>{this.state.prompt}</td></tr> : null}
            </>
        )
    }
}