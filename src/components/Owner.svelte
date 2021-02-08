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

  export let pin;
</script>

<Row>
  <Col><h4>Device Owner Info</h4></Col>
</Row>

<Form>
  <FormGroup>
    <Label for="ownerName">Name</Label>
    <Input
      disabled={pin === ''? 'disabled' : ''}
      type="text"
      name="ownerName"
      id="ownerName"
      placeholder="Ada Lovelace" />
  </FormGroup>
  <FormGroup>
    <Label for="companyName">Affiliation</Label>
    <Input
      disabled={pin === ''? 'disabled' : ''}
      type="text"
      name="companyName"
      id="companyName"
      placeholder="Blues Inc." />
  </FormGroup>
  <FormGroup>
    <Label for="ownerEmail">Contact Email</Label>
    <Input
      disabled={pin === ''? 'disabled' : ''}
      type="email"
      name="ownerEmail"
      id="ownerEmail"
      placeholder="ada@blues.com" />
  </FormGroup>
</Form>

<Row>
  <Col>
    <Button disabled={pin === ''? 'disabled' : ''}
      color="primary">Update Device Owner</Button>
  </Col>
</Row>