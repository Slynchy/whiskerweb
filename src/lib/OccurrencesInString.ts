/** Function that count occurrences of a substring in a string;
 * @param {String} string               The string
 * @param {String} subString            The sub string to search for
 * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
 *
 * @author Vitim.us https://gist.github.com/victornpb/7736865
 * @see Unit Test https://jsfiddle.net/Victornpb/5axuh96u/
 * @see https://stackoverflow.com/a/7924240/938822
 */
export function OccurrencesInString(string: string, subString: string, allowOverlapping: boolean) {

    string += "";
    subString += "";
    if (subString.length <= 0) return (string.length + 1);

    let n = 0,
        pos = 0,
        step = allowOverlapping ? 1 : subString.length;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        pos = string.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
}
