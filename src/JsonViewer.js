import React from 'react';
import {JSONEditor} from 'vanilla-jsoneditor';
import {Box, Paper, Stack, Typography} from "@mui/material";
import 'vanilla-jsoneditor/themes/jse-theme-dark.css';

// A wrapper for the vanilla-jsoneditor package. See https://github.com/josdejong/svelte-jsoneditor
export default function JsonViewer({data, title, readOnly = true, expandCallback = null}) {
  const refContainer = React.useRef(null);
  const refEditor = React.useRef(null);

  React.useEffect(() => {
    // create editor
    refEditor.current = new JSONEditor({
      target: refContainer.current,
      props: {}
    });

    return () => {
      // destroy editor
      if (refEditor.current) {
        refEditor.current.destroy();
        refEditor.current = null;
      }
    };
  }, []);

  // update props
  React.useEffect(() => {
    if (refEditor.current && data) {
      refEditor.current.updateProps({content: {json: data}, readOnly: readOnly, navigationBar: true, mainMenuBar: true, indentation: 2});
      if (expandCallback !== null) {
        refEditor.current.expand(expandCallback);
      }
    }
  }, [data, readOnly, expandCallback]);

  return (
    <Paper variant='outlined' sx={{padding: 0, margin: 0}}>
      <Stack>
        <Typography sx={{margin: 1}} hidden={!title}>{title ? title : 'JSON Viewer'}</Typography>
        <Box ref={refContainer} className={"light"}></Box>
      </Stack>
    </Paper>
  );
}
