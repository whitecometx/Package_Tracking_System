#!/bin/bash

# Output file
output_file="combined.txt"

# Clear the output file if it exists
> "$output_file"

# Get the current date
current_date=$(date +"%A, %B %d, %Y, %I %p %Z")

# Loop through each .rs file in the current directory
for file in *.ts; do
    # Check if there are any .rs files
    if [ -e "$file" ]; then
        # Write header to output file
        echo "/* ------------------------------------------------" >> "$output_file"
        echo "My package_tracker/client/frontend/src/services/$file is as follows:" >> "$output_file"
        echo "--------------------------------------------------- */" >> "$output_file"
        echo "Current date: $current_date" >> "$output_file"
        echo "" >> "$output_file"  # Add an empty line

        # Append the contents of the .rs file to the output file
        cat "$file" >> "$output_file"
        echo "" >> "$output_file"  # Add an empty line after each file's content
    fi
done

echo "Contents of .rs files have been combined into $output_file."