# How to run the program?

Run the following commands

- cp .env.example .env
- node injest.js
- node index.js

# What do I need to do to use a different model?

The `No vector column found to match with the query vector dimension` error occurs when the embedding output size of the model does not match the dimension of the vector being stored in the database.

```
Error: [Error: Failed to execute query stream: GenericFailure, Invalid input, No vector column found to match with the query vector dimension: 2304] {
  code: 'GenericFailure'
}
```

The vector dimension must match the output size of your embedding model.

- Make sure to delete db folder if the model needs to be changed.
- Update the following code block with the correct embedding size of the model you want to use. `Gemma2b:2b` has the embedding size of `2304`.

The information can be obtained from Ollama's library page.

https://ollama.com/library/gemma2%3A2b/blobs/7462734796d6

The embedding size is mentioned as: `embedding_length`

```
const table = await db.createTable(
  "knowledge_vectors",
  [{ vector: Array(2304), text: "", source: "" }],
  { writeMode: "overwrite" }
);
```

- Run `node injest.js` and `node index.js`

- project
  - src
    - main.py
    - utils.py
  - README.md

project/
|-- src/
| |-- main.py
| `-- utils.py
|-- tests/
|   `-- test_main.py
`-- README.md
