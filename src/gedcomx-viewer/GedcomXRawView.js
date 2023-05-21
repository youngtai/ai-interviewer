import React from "react";
import {Box} from "@mui/material";
import JsonViewer from "./JsonViewer";

export default function GedcomXRawView({gxRecordData}) {
  const singleGxRecord = gxRecordData.data;

  return (
    <>
      <Box sx={{
        overflowY: 'auto',
        width: '100%'
      }}>
        <JsonViewer title="GedcomX JSON" data={singleGxRecord} />
      </Box>
    </>
  );
}
