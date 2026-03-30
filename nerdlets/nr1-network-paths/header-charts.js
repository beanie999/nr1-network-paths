import React from 'react';
import { LineChart, Layout, LayoutItem, Grid, GridItem, ChartGroup, HeadingText, PlatformStateContext } from 'nr1';
import { getQueryTime } from './utils';

export default class HeaderCharts extends React.Component {
    whereClause = '';
    constructor(props) {
        super(props);
    }

    render() {
        return (
            this.whereClause = `${this.props.storeWhere} ${this.props.reachableWhere} ${this.props.protocolWhere} ${this.props.hostWhere}`,
            <PlatformStateContext.Consumer>
                {(platformState) => {
                    return (
                        <Layout>
                            <LayoutItem>
                                <Grid>
                                    <ChartGroup>
                                        <GridItem columnSpan={3}>
                                            <HeadingText>Latency</HeadingText>
                                            <LineChart
                                                accountIds={[this.props.accountId]}
                                                query={`FROM Log SELECT average(rtt) WHERE hop_count IS NOT NULL ${this.whereClause} TIMESERIES FACET entity.name ${getQueryTime(platformState.timeRange)}`}
                                            />
                                        </GridItem>
                                        <GridItem columnSpan={3}>
                                            <HeadingText>% unreachable</HeadingText>
                                            <LineChart
                                                accountIds={[this.props.accountId]}
                                                query={`FROM Log SELECT percentage(count(*), WHERE NOT is_destination_reachable) WHERE hop_count IS NOT NULL ${this.whereClause} TIMESERIES FACET entity.name ${getQueryTime(platformState.timeRange)}`}
                                            />
                                        </GridItem>
                                        <GridItem columnSpan={3}>
                                            <HeadingText>Jitter</HeadingText>
                                            <LineChart
                                                accountIds={[this.props.accountId]}
                                                query={`FROM Log SELECT average(jitter) WHERE hop_count IS NOT NULL ${this.whereClause} TIMESERIES FACET entity.name ${getQueryTime(platformState.timeRange)}`}
                                            />
                                        </GridItem>
                                        <GridItem columnSpan={3}>
                                            <HeadingText>Packet loss</HeadingText>
                                            <LineChart
                                                accountIds={[this.props.accountId]}
                                                query={`FROM Log SELECT average(packet_loss) WHERE hop_count IS NOT NULL ${this.whereClause} TIMESERIES FACET entity.name ${getQueryTime(platformState.timeRange)}`}
                                            />
                                        </GridItem>
                                    </ChartGroup>
                                </Grid>
                            </LayoutItem>
                        </Layout>
                    )
                }}
            </PlatformStateContext.Consumer>
        )
    }
}

