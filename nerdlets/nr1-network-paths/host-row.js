import React from 'react';
import DnsRows from './dns-rows';
import { tidyNumber } from './utils';

export default class HostRow extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
        };
    };

    render() {
        return (
            //console.log('Number of tests: ' + this.props.testCount),
            <>
                <tr key={this.props.hostIndex}>
                    <td style={{ paddingLeft: '30px', cursor: 'pointer' }} onClick={() => this.setState({ open: !this.state.open })}>
                        <b>{this.props.targetHost} ({this.props.protocol}{this.props.port ? ': ' + this.props.port : ''})</b></td>
                    <td>{tidyNumber(this.props.hopCount)}</td>
                    <td>{this.props.packetLoss}</td>
                    <td>{tidyNumber(this.props.unreachable)}</td>
                    <td>{tidyNumber(this.props.jitter)}</td>
                    <td>{tidyNumber(this.props.rtt)}</td>
                    <td></td>
                </tr>
                {
                    this.state.open ?
                        < DnsRows
                            accountId={this.props.accountId}
                            storeName={this.props.storeName}
                            targetHost={this.props.targetHost}
                            protocol={this.props.protocol}
                            port={this.props.port}
                            reachableWhere={this.props.reachableWhere}
                            testCount={this.props.testCount}
                            maxTimestamp={this.props.maxTimestamp}
                            minTimestamp={this.props.minTimestamp}
                            timeZone={this.props.timeZone}
                        /> : null
                }
            </>
        )
    };
}