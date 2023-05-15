import React from 'react';

import GedcomXGraphView from './GedcomXGraphView';
import {Divider, Tab, Tabs} from '@mui/material';
import GedcomXRawView from "./GedcomXRawView";

function GedcomXViewer({gxRecordData, qualityEstimates, visible, graphViewMinHeight}) {
  const singleGxRecord = gxRecordData.data;
  const [tab, setTab] = React.useState(1);

  return (
    <>
      <Divider/>
      <Tabs
        value={tab}
        onChange={(e, newValue) => setTab(newValue)}
      >
        <Tab label="Raw"/>
        <Tab label="Chart"/>
      </Tabs>
      <Divider/>
      <div hidden={tab !== 0}>
        <GedcomXRawView gxRecordData={gxRecordData}/>
      </div>
      <div hidden={tab !== 1}>
        {visible && <GedcomXGraphView gx={singleGxRecord} qualityEstimates={qualityEstimates} minHeight={graphViewMinHeight}/>}
      </div>
    </>
  )
}

export default GedcomXViewer;
