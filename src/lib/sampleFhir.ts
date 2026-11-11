/**
 * Sample FHIR R4 Bundle — clearly fictional data for demonstration.
 * Patient, Encounter, Condition, Observation, MedicationRequest.
 */
export const SAMPLE_FHIR_BUNDLE = `{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "patient-sample-1",
        "name": [{ "family": "Morgan", "given": ["Alex"] }],
        "gender": "female",
        "birthDate": "1990-04-12"
      }
    },
    {
      "resource": {
        "resourceType": "Encounter",
        "id": "encounter-sample-1",
        "status": "finished",
        "class": { "code": "IMP", "display": "Inpatient" },
        "subject": { "reference": "Patient/patient-sample-1" },
        "period": { "start": "2026-10-28", "end": "2026-11-02" }
      }
    },
    {
      "resource": {
        "resourceType": "Condition",
        "id": "condition-sample-1",
        "clinicalStatus": { "text": "active" },
        "code": { "text": "Community-acquired pneumonia" },
        "subject": { "reference": "Patient/patient-sample-1" },
        "onsetDateTime": "2026-10-28"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "observation-sample-1",
        "status": "final",
        "code": { "text": "Hemoglobin" },
        "subject": { "reference": "Patient/patient-sample-1" },
        "effectiveDateTime": "2026-11-05",
        "valueQuantity": { "value": 11.8, "unit": "g/dL" }
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "observation-sample-2",
        "status": "final",
        "code": { "text": "Glucose" },
        "subject": { "reference": "Patient/patient-sample-1" },
        "effectiveDateTime": "2026-11-05",
        "valueQuantity": { "value": 142, "unit": "mg/dL" }
      }
    },
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "medreq-sample-1",
        "status": "active",
        "medicationCodeableConcept": { "text": "Amoxicillin 500 mg" },
        "subject": { "reference": "Patient/patient-sample-1" },
        "authoredOn": "2026-11-02",
        "dosageInstruction": [{ "text": "500 mg three times daily for 7 days" }]
      }
    }
  ]
}`;
