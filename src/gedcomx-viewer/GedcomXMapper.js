const generateLocalId = () => Math.random().toString(36).substring(2, 9);

const GEDCOMX = "http://gedcomx.org/";

const genderCharToURIMap = {
  "M": `${GEDCOMX}Male`,
  "F": `${GEDCOMX}Female`,
  "U": `${GEDCOMX}Unknown`
};

const rawRelStringToGedcomxURIMap = {
  "couple": `${GEDCOMX}Couple`,
  "married": `${GEDCOMX}Couple`,
  "spouse": `${GEDCOMX}Couple`,
  "parent": `${GEDCOMX}ParentChild`,
  "father": `${GEDCOMX}ParentChild`,
  "mother": `${GEDCOMX}ParentChild`,
  "parent-child": `${GEDCOMX}ParentChild`,
  "parentchild": `${GEDCOMX}ParentChild`,
  "grandparent": `${GEDCOMX}Grandparent`,
  "godparent": `${GEDCOMX}Godparent`,
  "other" : `${GEDCOMX}Other`
};

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

function mapFacts(person) {
  return person.facts?.map(fact => {
    const factType = fact.type ? `${GEDCOMX}${toTitleCase(fact.type)}` : `${GEDCOMX}Unknown`;
    const factDate = fact.date ? fact.date : null;
    const factPlace = fact.place ? fact.place : null;

    const newFact = {type: factType};
    if (factDate) {
      newFact['date'] = {original: factDate};
    }
    if (factPlace) {
      newFact['place'] = {original: factPlace};
    }
    return newFact;
  });
}

function mapGender(person) {
  const genderChar = person.gender ? person.gender : "U";
  return {type: genderCharToURIMap[genderChar]};
}

function mapNames(person, nameParts) {
  const parts = [];
  if (person.given) {
    parts.push({
      type: "http://gedcomx.org/Given",
      value: person.given
    });
  }
  if (person.surname) {
    parts.push({
      type: "http://gedcomx.org/Surname",
      value: person.surname
    });
  }
  return [{
    nameForms: [{
      fullText: nameParts.join(" "),
      parts: parts
    }]
  }];
}

function mapPersons(persons) {
  return persons?.map(person => {
    const id = person.id ? person.id : generateLocalId();
    const given = person.given ? person.given : null;
    const surname = person.surname ? person.surname : null;
    const nameParts = [given, surname].filter(e => e);
    const gxPerson = {
      id: id,
      gender: mapGender(person),
      facts: mapFacts(person)
    };

    if (nameParts.length > 0) {
      gxPerson.names = mapNames(person, nameParts);
    }

    return gxPerson;
  });
}

function personIdIsValid(id, persons) {
  if (!id || !persons) {
    return false;
  }

  const allPersonIds = persons.map(person => person.id);
  return allPersonIds.includes(id);
}

function mapRelationships(relationships, persons) {
  return relationships?.map(rel => {
    const p1 = rel.person1;
    const p2 = rel.person2;
    if (!personIdIsValid(p1, persons) || !personIdIsValid(p2, persons)) {
      return null;
    }

    const rawRelType = rel?.type ? rel.type : "Unknown";
    const relType = rawRelType && rawRelStringToGedcomxURIMap[rawRelType.toLowerCase()] ? rawRelStringToGedcomxURIMap[rawRelType.toLowerCase()] : rawRelType;
    const person1 = {resource: `#${p1}`, resourceId: p1};
    const person2 = {resource: `#${p2}`, resourceId: p2};

    return {
      type: relType,
      person1: person1,
      person2: person2
    }
  }).filter(x => x);
}

function mapSourceDescriptions(dataCopy) {
  const recordType = dataCopy.recordFact?.type ? toTitleCase(dataCopy.recordFact?.type) : "Unknown";
  const recordDate = dataCopy.recordFact?.date ? dataCopy.recordFact?.date : null;
  const recordPlace = dataCopy.recordFact?.place ? dataCopy.recordFact?.place : null;

  const coverage = [{recordType: `http://gedcomx.org/${recordType}`}];
  if (recordPlace) {
    coverage[0].spatial = {original: recordPlace};
  }
  if (recordDate) {
    coverage[0].temporal = {original: recordDate};
  }

  return [{
    resourceType: "http://gedcomx.org/Record",
    coverage: coverage
  }];
}

function convert(dataList) {
  if (!dataList) {
    return;
  }

  return dataList.map(data => {
    const persons = mapPersons(data.persons);
    const relationships = mapRelationships(data.relationships, persons);
    const sourceDescriptions = mapSourceDescriptions(data);
    return {
      persons: persons ? persons : [],
      relationships: relationships ? relationships : [],
      sourceDescriptions: sourceDescriptions ? sourceDescriptions : []
    }
  });
}

export default convert;
