import React from 'react';
import {findDOMNode} from 'react-dom';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Divider,
  Grid,
  List,
  ListItemText,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import {ExpandMore} from "@mui/icons-material";
import {useTheme} from "@mui/material/styles";
import JsonViewer from "./JsonViewer";

function GraphLegend() {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore/>}>
        <Typography variant='subtitle1'>Legend</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container direction="column">
          <Grid item>
            <Grid container direction="row" alignItems="center">
              <Grid item>
                <Typography variant="subtitle1">Name Parts:</Typography>
              </Grid>
              <Grid item>
                <Box sx={{fontWeight: 'lighter', color: '#8a0000', marginRight: 1, marginLeft: 1}}>Prefix</Box>
              </Grid>
              <Grid item>
                <Box sx={{fontWeight: 'lighter', color: '#000000', marginRight: 1}}>Given Name</Box>
              </Grid>
              <Grid item>
                <Box sx={{fontWeight: 'lighter', color: '#400180', marginRight: 1}}>Surname</Box>
              </Grid>
              <Grid item>
                <Box sx={{fontWeight: 'lighter', color: '#9c9c9c', marginRight: 1}}>Suffix</Box>
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Grid container direction="row" alignItems="center">
              <Grid item>
                <Typography variant="subtitle1">Full Name (no name parts):</Typography>
              </Grid>
              <Grid item>
                <Box sx={{marginLeft: 1}}>Full Name Example</Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

function GedcomXGraphViewer({ gx, qualityEstimates, minHeight }) {
  const theme = useTheme();

  const gxRef = React.useRef();
  const [coverageDisplay, setCoverageDisplay] = React.useState([<Typography key="cov-str" variant="subtitle1">"No Coverage data"</Typography>]);
  const [showQualityEstimates, setShowQualityEstimates] = React.useState(false);
  const [alert, setAlert] = React.useState("");

  const displayAlert = alert !== "";

  React.useEffect(function () {
    if (gx && gxRef && gxRef.current) {
      try {
        let graph = new window.RelationshipGraph(gx);
        new window.RelChartBuilder(graph, window.$(findDOMNode(gxRef.current)), new window.ChartOptions({ shouldShowConfidence: true, shouldDisplayIds: false })).buildChart();
      } catch (e) {
        console.error(e);
        setAlert("There was an error building the GedcomX Graph. See the dev console for a stack trace.");
      }
    }
  }, [gx]);

  React.useEffect(() => {
    if (gx && gx.sourceDescriptions) {
      const sourceDescriptionWithCoverage = gx.sourceDescriptions.find(sourceDescription => sourceDescription.coverage);
      if (!sourceDescriptionWithCoverage) {
        return;
      }

      const coverageObjectArray = sourceDescriptionWithCoverage.coverage;

      function buildCoverageElement(coverageObj, index) {
        let typeString;
        let temporalString;
        let spatialString;

        if (coverageObj.recordType) {
          typeString = coverageObj.recordType;
        }
        if (coverageObj.temporal && coverageObj.temporal.original) {
          temporalString = coverageObj.temporal.original;
        }
        if (coverageObj.spatial && coverageObj.spatial.original) {
          spatialString = coverageObj.spatial.original;
        }

        return (
          <Paper key={`coverage${index}`} sx={{paddingX: theme.spacing(2), paddingY: theme.spacing(1)}}>
            <List dense disablePadding>
              <ListItemText primary={typeString} secondary='Record Type' sx={{marginY: 1}}/>
              <Divider/>
              <ListItemText primary={temporalString} secondary='Temporal' sx={{marginY: 1}}/>
              <Divider/>
              <ListItemText primary={spatialString} secondary='Spatial' sx={{marginY: 1}}/>
            </List>
          </Paper>
        )
      }

      setCoverageDisplay(coverageObjectArray.map(buildCoverageElement));
    } else {
      setCoverageDisplay([<Typography key="cov-str" variant="subtitle1">"No Coverage data"</Typography>]);
    }
  }, [gx, theme]);

  React.useEffect(() => {
    if (qualityEstimates && qualityEstimates.QualityIndex) {
      setShowQualityEstimates(true);
    } else {
      setShowQualityEstimates(false);
    }
  }, [qualityEstimates]);

  return (
    <Box sx={minHeight ? {margin: theme.spacing(3), minHeight: minHeight} : {margin: theme.spacing(3)}}>
      <div hidden={!showQualityEstimates}>
        <JsonViewer data={qualityEstimates} title="Quality Estimates" />
      </div>
      <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="flex-start">
        {coverageDisplay}
        <GraphLegend/>
      </Stack>
      {displayAlert ? <Alert severity="error" onClose={() => setAlert("")} sx={{marginTop: 2}}>{alert}</Alert> : null}
      <Box ref={gxRef} sx={{position: 'relative', height: 'auto', overflowX: 'auto', fontSize: '14px', marginTop: 2, color: '#000000'}}/>
    </Box>
  );
}

export default GedcomXGraphViewer;
