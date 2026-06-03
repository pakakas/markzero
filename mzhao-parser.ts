export function parseADN(payload: string): any {
    const pointers: any[] = [];
    
    // ⓖ is a group separator. We split by it.
    const groups = payload.split('ⓖ').filter(Boolean);
    
    for (const content of groups) {
        // Type 1: Column-based (Array of Objects, or single Object encoded with columns)
        if (content.startsWith('ᴄ')) {
            const parts = content.split('ʀ');
            const header = parts[0].substring(1); // remove 'ᴄ'
            const keys = header.split('¦');
            
            const arr = [];
            for (let i = 1; i < parts.length; i++) {
                if (!parts[i]) continue;
                const values = parts[i].split('¦');
                const obj: any = {};
                for (let j = 0; j < keys.length; j++) {
                    obj[keys[j]] = resolveValue(values[j], pointers);
                }
                arr.push(obj);
            }
            
            // If it's a column format and has 1 row, usually MarkZero encodes single objects this way if it saves space.
            // Let's store it as an array, but if it's the very last group, we might want to return it as an object if needed.
            // For now, let's keep the array format. Wait, the root object was a flat object in JSON.
            // Let's just store the array.
            const valToStore = arr.length === 1 && content === groups[groups.length - 1] ? arr[0] : arr;
            pointers.push(valToStore);
        } 
        // Type 2: Object Key-Value
        else if (content.includes('→')) {
            const parts = content.split('ʀ');
            const obj: any = {};
            for (const part of parts) {
                if (!part) continue;
                const [key, val] = part.split('→');
                if (key && val) {
                    obj[key] = resolveValue(val, pointers);
                }
            }
            pointers.push(obj);
        } 
        // Type 3: Array of Primitives
        else {
            const parts = content.split('ʀ').filter(Boolean);
            const arr = parts.map(p => resolveValue(p, pointers));
            pointers.push(arr);
        }
    }
    
    // The last pointer is the root
    if (pointers.length > 0) {
        return pointers[pointers.length - 1];
    }
    return null;
}

function resolveValue(val: string, pointers: any[]): any {
    if (!val) return val;
    if (val.startsWith('※')) {
        const idx = parseInt(val.substring(1), 10);
        return pointers[idx];
    }
    if (/^\d+$/.test(val)) {
        return parseInt(val, 10);
    }
    return val;
}

// === TEST CASE ===
if (import.meta.main) {
    const adn = "ⓖ124ʀ129ⓖʀfile→src/main.0ʀspan→※0ⓖᴄtype¦pos¦textʀinsert¦124¦let ⓖʀrepair_id→REP_ADD_LETʀactions→※2ⓖᴄcode¦message¦node_id¦location¦repairʀNAM003¦Undeclared identifier 'count'¦ast_node_592¦※1¦※3";
    
    console.log("=== Original ADN ===");
    console.log(adn);
    
    console.time("Parse Time");
    const result = parseADN(adn);
    console.timeEnd("Parse Time");
    
    console.log("\n=== Parsed JSON Object ===");
    console.log(JSON.stringify(result, null, 2));
}
