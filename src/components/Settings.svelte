<script>
  import Slider from './Slider.svelte';
  import {
    Button,
    Col,
    Row,
    Form,
    FormGroup,
    Input,
    Label
  } from 'sveltestrap';

  let currentFrequency = 60;
</script>

<Row>
  <Col><h4>Device Settings</h4></Col>
</Row>

<Form>
  <FormGroup>
    <Label for="deviceName">Device name</Label>
    <Input
      type="text"
      name="name"
      id="deviceName"
      placeholder="my-airnote-name" />
  </FormGroup>
  <FormGroup>
    <Label for="displayValue">LCD display value</Label>
    <Input type="select" name="display" id="displayValue">
      <option>PM2.5 (default)</option>
      <option>Temp (&deg;C)</option>
      <option>Temp (&deg;F)</option>
      <option>Humidity</option>
      <option>Barometric Pressure</option>
      <option>PM1</option>
      <option>PM10</option>
    </Input>
  </FormGroup>
  <FormGroup>
    <Label for="sampleFrequency">Sample frequency</Label>
    <Slider frequency={currentFrequency} />
  </FormGroup>
</Form>

<Row>
  <Col>
    <Button color="primary">Update Device Settings</Button>
  </Col>
</Row>

<style>
  :global(.form-group) {
    text-align: left;
  }

  :global(.form-group label) {
    color: #638097;
  }

  :global(.form-control) {
    border: 1px solid #dee5ea;
  }

  :global(.form-control::placeholder) {
    color: #b1bcc5;
  }

  /*:global(input[type="range"]::-webkit-slider-runnable-track {
    width: 100%;
    height: 1.2em;
    cursor: pointer;
    border: 1px solid #29334f;
    overflow: hidden;
  }*/

  :global(input[type="range" i]::-webkit-slider-thumb) {
    background-color: #dee5ea;
  }
</style>