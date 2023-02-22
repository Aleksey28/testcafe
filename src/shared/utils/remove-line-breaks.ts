export default function (str: string): string {
    return str.replace(/(\r\n|\n|\r)/gm, '');
}
