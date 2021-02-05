<script>
  import {
    Button,
    Col,
    Form,
    FormGroup,
    Input,
    Label,
    Row
  } from 'sveltestrap';
</script>

<Row>
  <Col><h4>Device Owner Info</h4></Col>
</Row>

<Form>
  <FormGroup>
    <Label for="ownerName">Name</Label>
    <Input
      type="text"
      name="ownerName"
      id="ownerName"
      placeholder="Ada Lovelace" />
  </FormGroup>
  <FormGroup>
    <Label for="companyName">Affiliation</Label>
    <Input
      type="text"
      name="companyName"
      id="companyName"
      placeholder="Blues Inc." />
  </FormGroup>
  <FormGroup>
    <Label for="ownerEmail">Contact Email</Label>
    <Input
      type="email"
      name="ownerEmail"
      id="ownerEmail"
      placeholder="ada@blues.com" />
  </FormGroup>
</Form>

<Row>
  <Col>
    <Button color="primary">Update Device Owner</Button>
  </Col>
</Row>