const JSON_EXAMPLE = `{
    persons: [
      {
        id: "an id, like p1, p2, ...",
        given: "given name",
        surname: "surname",
        gender: "M, F, U",
        facts: [
          {
            type: "fact type for a life event, like birth, death, baptism, marriage, ...",
            date: "date of fact if present, can be inferred from age or other facts",
            place: "where fact happened if present"
          },
          {
            type: "fact type for a life event, like birth, death, baptism, marriage, ...",
            date: "date of fact if present, can be inferred from age or other facts",
            place: "where fact happened if present"
          }
        ]
      },
      {
        id: "an id, like p1, p2, ...",
        given: "given name",
        surname: "surname",
        gender: "M, F, U",
        facts: [
          {
            type: "fact type for a life event, like birth, death, baptism, marriage, ...",
            date: "date of fact if present, can be inferred from age or other facts",
            place: "where fact happened if present"
          },
          {
            type: "fact type for a life event, like birth, death, baptism, marriage, ...",
            date: "date of fact if present, can be inferred from age or other facts",
            place: "where fact happened if present"
          }
        ]
      },
      ...
    ],
    relationships: [
      {
        type: “Should be: couple, parent, grandparent, godparent, other”
        person1: “id of person1, using the id from a person object. person1 is the older person, like the parent, grandparent or godparent’“,
        person2: “id of person2, using the id from a person object. person2 is the younger person, like child, grandchild or godchild’“,
      },
      ...
    ],
    recordFact: {
      type: "the type of fact that caused the document to be created, like birth, death, burial, marriage, baptism, ...",
      date: "date of the fact that caused the document to be created, if present",
      place: "date of the fact that caused the document to be created, if present"
    }
  }`;
export const INDEXING_PROMPT = `The following is a conversation containing an oral family history. Extract the vital data into JSON. Format the JSON like\n${JSON_EXAMPLE}\n\nDo not add explanations. Format dates like '3 July 1840'`;
