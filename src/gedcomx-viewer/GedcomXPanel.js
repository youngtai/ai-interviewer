import React from 'react';

import GedcomXViewer from './GedcomXViewer'
import {Paper, Tab, Tabs} from '@mui/material';

function buildGxRecordData(record) {
  return {
    data: record,
    text: JSON.stringify(record, null, 2)
  };
}

function getQualityEstimates(recordQualityEvaluations, selectedRecord) {
  return recordQualityEvaluations && recordQualityEvaluations[selectedRecord] ? recordQualityEvaluations[selectedRecord].qualityEstimates : [];
}

/*
ambiguousGedcomX can be one of:
- An individual GX object.
- An array of individual GX objects.
- A GX object with a records field containing a list of individual GX objects.

This component will interpret it correctly and display tabs for each record.
*/
function GedcomXPanel({ ambiguousGedcomX, gxLabels, recordQualityEvaluations, visible = true, setRecordIndex, graphViewMinHeight='' }) {
  const gxRecordData = React.useMemo(() => {
    if (ambiguousGedcomX) {
      if (Array.isArray(ambiguousGedcomX)) {
        return ambiguousGedcomX.map(buildGxRecordData);
      }
      else if (ambiguousGedcomX.records && ambiguousGedcomX.records.length > 0) {
        return ambiguousGedcomX.records.map(buildGxRecordData);
      }
      else {
        return [buildGxRecordData(ambiguousGedcomX)];
      }
    }

    return [];
  }, [ambiguousGedcomX]);

  const [selectedRecord, setSelectedRecord] = React.useState(0);

  let tabs;
  if (gxRecordData.length > 0 && visible) {
    if (!gxRecordData[selectedRecord]) {
      setSelectedRecord(0);
    }

    tabs = (
      <>
        <Tabs
          value={selectedRecord}
          onChange={(e, newValue) => {
            setSelectedRecord(newValue);
            if (setRecordIndex) {
              setRecordIndex(newValue);
            }
          }}
          variant="scrollable"
        >
          {gxRecordData.map((r, idx) => <Tab key={idx} label={gxLabels ? gxLabels[idx] : `Record ${idx + 1}`} />)}
        </Tabs>
        <GedcomXViewer
          gxRecordData={gxRecordData[selectedRecord] ? gxRecordData[selectedRecord] : gxRecordData[0]}
          qualityEstimates={getQualityEstimates(recordQualityEvaluations, selectedRecord)}
          visible
          graphViewMinHeight={graphViewMinHeight}
        />
      </>
    )
  }

  return (
    <Paper variant={"outlined"}>
      {tabs}
    </Paper>
  );
}

export default GedcomXPanel;
