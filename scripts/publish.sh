version=$(<version.txt)
notes=$(head -n 1 release-notes.txt)
echo "Publishing release to github Releases\n\n"
echo "Version: $version\n"
echo "Notes: $notes\n\n"
read -r -p "Do you want to continue? [y/N] " response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]
then
    git tag -d $version
    ncc build index.js --license licenses.txt
    git add -A
    git commit -S -m "$notes"
    git push
    git tag $version
    git push --tags
else
    clear
    echo "Release proces canceled!"
fi
