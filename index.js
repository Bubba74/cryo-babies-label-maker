
const MAX_LABELS_PER_PAGE = 68;

/* Input: string
 * Output: list of values
 */
function getValues (rawInput)
{
    // Commas separate completely independent groups, then add them back together
    let groups = rawInput.split(",");
    if (groups.length > 1)
    {
        // Expand each individual group then concatenate together
        return groups.map(getValues).flat();
    }

    // Hyphens enable prefixing / suffixing strings onto sub-expressions
    // For example:
    //      A-01..05
    // Is split into:
    //      ["A", "01..05"]
    // Expanded into:
    //      [["A"], ["01", "02", "03", "04", "05"]]
    // Then combined back into:
    //      ["A-01", "A-02", "A-03", "A-04", "A-05"]
    let hyphens = rawInput.split("-"); /* e.g. ["A", "01..05"] */
    if (hyphens.length > 1)
    {
        /* Example: [["A"], ["01", "02", "03", "04", "05"]] */
        let expandedValues = hyphens.map(getValues);

        /* Example: [["A", "01"], ["A", "02"], ["A", "03"], ["A", "04"], ["A", "05"]] */
        let combinations = generateCombinations(expandedValues);

        /* Example: ["A-01", "A-02", "A-03", "A-04", "A-05"] */
        let merged = combinations.map((pair) => pair.join("-"));

        return merged;
    }

    // The double-dot ".." enables expanding a numeric range
    // For example:
    //      01..05
    // Is split into:
    //      ["01", "05"]
    // Parsed as:
    //      [1, 5]
    // Expanded to:
    //      [1, 2, 3, 4, 5]
    // And stringified into:
    //      ["1", "2", "3", "4", "5"]
    let bounds = rawInput.split("..");
    if (bounds.length > 1)
    {
        if (bounds.length > 2)
        {
            alert("Bad input, invalid bounds: " + rawInput);
            return [];
        }
        else
        {
            let numbers = bounds.map(parseFloat);
            let start = numbers[0];
            let stop = numbers[1];
            let range = Array.from({length: stop - start + 1}, (x, i) => i + start);

            return range.map((num) => ("" + num));
        }
    }

    return [rawInput];
}

function generateCombinations (dimensions)
{
    /* Base case, return empty list */
    if (dimensions.length == 0)
        return []
    else if (dimensions.length == 1)
    {
        return dimensions[0];
    }
    else
    {
        let outputs = [];

        /* Generate combos from this node with its children, e.g.
         *  values = [1, 2]
         *  children = [[a], [b], [c]]
         *  outputs = [
         *      [1, a], [1, b], [1, c],
         *      [2, a], [2, b], [2, c],
         *  ]
         */
        let dim = dimensions[0];
        let children = generateCombinations(dimensions.slice(1));
        for (let d=0; d<dim.length; d++)
        {
            for (let c=0; c<children.length; c++)
            {
                outputs.push([dim[d]].concat(children[c]));
            }
        }

        return outputs;
    }
}

function parseScript ()
{
    const scripts = document.getElementById("script_box").value;
    const lines = scripts.split("\n");

    let debug = document.getElementById("console");
    let output = document.getElementById("raw_box");

    debug.value = "";
    for (let i=0; i<lines.length; i++)
    {
        let line = lines[i];
        let segments = line.split(" ");

        debug.value += line + "\n";

        if (line[0] == "#")
        {
            debug.value += "(ignored)\n";
        }
        else if (segments.length <= 1)
        {
            debug.value += "(empty)\n";
        }
        else if (segments.length != 6)
        {
            debug.value += "Err: row does not have 6 columns!\n";
        }
        else
        {
            /* Expand stuff like "01..05" into ["01", "02", "03", "04", "05"]; */
            let values = segments.map(getValues);

            /* Generate combos of individual dimensions */
            let combos = generateCombinations(values);

            /* Add to output box */
            combos.forEach(
                (combo) => {
                    output.value += combo.join(" ") + "\n";
                }
            );

            debug.value += "Generated " + combos.length + " combinations.\n";
        }
    }
}

function generateOneDocument (filename, labels)
{
    z = new Zip(filename);

    var document_xml_modified = document_xml;

    for (let i=0; i < labels.length; i++)
    {
        /* Example:
         *  NH 11-20-24 UM 209 3 Tibia
         */
        let label = labels[i];
        let parts = label.split(" ");
        let match_number = String(i+1).padStart(2, "0");

        document_xml_modified = (
            document_xml_modified
            .replace(`INITIALS_${match_number}`, parts[0])
            .replace(`MM_DD_YY_${match_number}`, parts[1])
            .replace(`UM_OR_OTHER_${match_number}`, parts[2])
            .replace(`IDENTITY_1_${match_number}`, parts[3])
            .replace(`IDENTITY_2_${match_number}`, parts[3])
            .replace(`INDEX_1_${match_number}`, parts[4])
            .replace(`INDEX_2_${match_number}`, parts[4])
            .replace(`SAMPLE_TYPE_${match_number}`, parts[5])
        );
    }

    document_xml_modified = (
        document_xml_modified
        .replaceAll("INITIALS_", "FL")
        .replaceAll("MM_DD_YY_", "mm-dd-yy")
        .replaceAll("UM_OR_OTHER_", "CC")
        .replaceAll("IDENTITY_1_", "0")
        .replaceAll("IDENTITY_2_", "0")
        .replaceAll("INDEX_1_", "0")
        .replaceAll("INDEX_2_", "0")
        .replaceAll("SAMPLE_TYPE_", "X")
    )

    z.str2zip("[Content_Types].xml", content_types_xml, "");
    z.str2zip("app.xml", app_xml, "docProps/");
    z.str2zip("custom.xml", custom_xml, "docProps/");
    z.str2zip("core.xml", core_xml, "docProps/");
    z.str2zip(".rels", dot_rels, "_rels/");
    z.str2zip("document.xml", document_xml_modified, "word/");
    z.str2zip("fontTable.xml", fontTable_xml, "word/");
    z.str2zip("settings.xml", settings_xml, "word/");
    z.str2zip("styles.xml", styles_xml, "word/");
    z.str2zip("webSettings.xml", webSettings_xml, "word/");
    z.str2zip("theme1.xml", theme1_xml, "word/theme/");
    z.str2zip("document.xml.rels", document_xml_rels, "word/_rels/");

    z.makeZip();
}

function generateAllDocuments ()
{
    const output_name = document.getElementById("cfg_prefix").value;
    const raw_labels = document.getElementById("raw_box").value.trim().split("\n");

    for (let page_ix = 0; page_ix * MAX_LABELS_PER_PAGE < raw_labels.length; page_ix++)
    {
        let left = page_ix * MAX_LABELS_PER_PAGE;
        let right = left + MAX_LABELS_PER_PAGE;
        let one_page_of_labels = raw_labels.slice(left, right);
        right = left + one_page_of_labels.length;
        let filename = `${output_name}_${left+1}_${right}.docx`

        generateOneDocument(filename, one_page_of_labels);
    }
}
