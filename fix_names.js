const fs = require('fs');
const glob = require('glob');

const replaceInFile = (file) => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Pattern 1: `${obj.firstName} ${obj.lastName}` -> `${obj.lastName.toUpperCase()} ${obj.firstName}`
    content = content.replace(/\$\{([a-zA-Z0-9_\.\?]+)\.firstName\} \$\{([a-zA-Z0-9_\.\?]+)\.lastName\}/g, (match, p1, p2) => {
        if (p1 === p2) {
            return `\${${p1}.lastName?.toUpperCase() || ${p1}.lastName} \${${p1}.firstName}`;
        }
        return match;
    });

    // Pattern 2: {obj.firstName} {obj.lastName} in JSX -> {obj.lastName?.toUpperCase()} {obj.firstName}
    content = content.replace(/\{([a-zA-Z0-9_\.\?]+)\.firstName\}\s*\{([a-zA-Z0-9_\.\?]+)\.lastName\}/g, (match, p1, p2) => {
        if (p1 === p2) {
            return `{${p1}.lastName?.toUpperCase() || ${p1}.lastName} {${p1}.firstName}`;
        }
        return match;
    });

    // Pattern 3: `${obj.lastName} ${obj.firstName}` -> `${obj.lastName.toUpperCase()} ${obj.firstName}`
    content = content.replace(/\$\{([a-zA-Z0-9_\.\?]+)\.lastName\}\s*\$\{([a-zA-Z0-9_\.\?]+)\.firstName\}/g, (match, p1, p2) => {
        if (p1 === p2) {
            return `\${${p1}.lastName?.toUpperCase() || ${p1}.lastName} \${${p1}.firstName}`;
        }
        return match;
    });

    // Pattern 4: {obj.lastName || '---'} {obj.firstName || ''} in JSX
    content = content.replace(/\{([a-zA-Z0-9_\.\?]+)\.lastName \|\| '---'\}\s*\{([a-zA-Z0-9_\.\?]+)\.firstName \|\| ''\}/g, (match, p1, p2) => {
        if (p1 === p2) {
            return `{${p1}.lastName?.toUpperCase() || '---'} {${p1}.firstName || ''}`;
        }
        return match;
    });

    // Pattern 5: {obj.lastName} {obj.firstName} in JSX
    content = content.replace(/\{([a-zA-Z0-9_\.\?]+)\.lastName\}\s*\{([a-zA-Z0-9_\.\?]+)\.firstName\}/g, (match, p1, p2) => {
        if (p1 === p2) {
            return `{${p1}.lastName?.toUpperCase() || ${p1}.lastName} {${p1}.firstName}`;
        }
        return match;
    });

    // Pattern 6: `${obj.firstName[0]}${obj.lastName[0]}` (Initials, leave them but maybe uppercase the last one?)
    // Actually initials are fine.

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
};

const pattern1 = 'src/**/*.js';
const pattern2 = 'frontend/src/**/*.jsx';
const pattern3 = 'frontend/src/**/*.js';

[...glob.sync(pattern1), ...glob.sync(pattern2), ...glob.sync(pattern3)].forEach(replaceInFile);

console.log("Done.");
