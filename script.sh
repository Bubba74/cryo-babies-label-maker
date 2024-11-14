#!/bin/bash

MAX_CELLS=68  # 4 columns x 17 rows

input_file="${1:?Need an input file}"
output_file="${2:?Need an output file}"

echo "Input: $input_file" >&2
echo "Output: $output_file" >&2

SED_EXPRESSIONS=()

cell_number=1
while read INITIALS MM_DD_YY UM_OR_OTHER SAMPLE_TYPE IDENTITY INDEX; do
    if [[ -z "$INITIALS" ]] ||
       [[ -z "$MM_DD_YY" ]] ||
       [[ -z "$UM_OR_OTHER" ]] ||
       [[ -z "$SAMPLE_TYPE" ]] ||
       [[ -z "$IDENTITY" ]] ||
       [[ -z "$INDEX" ]]; then
       echo "Warn: ignoring line -- $INITIALS $MM_DD_YY $UM_OR_OTHER $SAMPLE_TYPE $IDENTITY $INDEX" >&2
    fi

    if [ $cell_number -gt $MAX_CELLS ]; then
        echo "Too many input lines!" >&2
        echo "Not processing any input!"
        echo "exit -1"
        exit -1
    fi
    label=$(printf "%02d" "$cell_number")
    SED_EXPRESSIONS[${#SED_EXPRESSIONS[@]}]="-e"
    SED_EXPRESSIONS[${#SED_EXPRESSIONS[@]}]="s/INITIALS_${label}/$INITIALS/"
    SED_EXPRESSIONS[${#SED_EXPRESSIONS[@]}]="-e"
    SED_EXPRESSIONS[${#SED_EXPRESSIONS[@]}]="s/MM_DD_YY_${label}/$MM_DD_YY/"
    SED_EXPRESSIONS[${#SED_EXPRESSIONS[@]}]="-e"
    SED_EXPRESSIONS[${#SED_EXPRESSIONS[@]}]="s/UM_OR_OTHER_${label}/$UM_OR_OTHER/"
    SED_EXPRESSIONS[${#SED_EXPRESSIONS[@]}]="-e"
    SED_EXPRESSIONS[${#SED_EXPRESSIONS[@]}]="s/SAMPLE_TYPE_${label}/$SAMPLE_TYPE/"
    SED_EXPRESSIONS[${#SED_EXPRESSIONS[@]}]="-e"
    SED_EXPRESSIONS[${#SED_EXPRESSIONS[@]}]="s/IDENTITY_1_${label}/$IDENTITY/"
    SED_EXPRESSIONS[${#SED_EXPRESSIONS[@]}]="-e"
    SED_EXPRESSIONS[${#SED_EXPRESSIONS[@]}]="s/IDENTITY_2_${label}/$IDENTITY/"
    SED_EXPRESSIONS[${#SED_EXPRESSIONS[@]}]="-e"
    SED_EXPRESSIONS[${#SED_EXPRESSIONS[@]}]="s/INDEX_1_${label}/$INDEX/"
    SED_EXPRESSIONS[${#SED_EXPRESSIONS[@]}]="-e"
    SED_EXPRESSIONS[${#SED_EXPRESSIONS[@]}]="s/INDEX_2_${label}/$INDEX/"
    cell_number=$(($cell_number+1))
    # echo "Expressions: ${SED_EXPRESSIONS[@]}" >&2
done

# echo "${SED_EXPRESSIONS[@]}" > expressions.out

xmllint --noblanks "$input_file" | \
    sed ${SED_EXPRESSIONS[@]} | \
    sed \
        -e "s/INITIALS_/FL/g" \
        -e "s/MM_DD_YY_/mm-dd-yy/g" \
        -e "s/UM_OR_OTHER_/CC/g" \
        -e "s/SAMPLE_TYPE_/X/g" \
        -e "s/IDENTITY_1_/0/g" \
        -e "s/IDENTITY_2_/0/g" \
        -e "s/INDEX_1_/0/g" \
        -e "s/INDEX_2_/0/g" |
    xmllint --format /dev/stdin > "$output_file"

