const capitalize = function (originalInput: string): string {
    return originalInput.charAt(0).toUpperCase() + originalInput.slice(1);
};

export default {
    getSentenceSubject: (isRecursive: boolean) => {
        return isRecursive ? `container` : `action target`;
    },
    chainMessage: (originalInput:string) => {
        originalInput = originalInput.trimStart();
        return originalInput.replace(/The/, 'its') || '';
    },
    notElementOrTextNode: (sentenceSubject: string) => `
        The ${sentenceSubject} is neither a DOM element nor a text node.
    `,
    elOutsideBounds: (target: string, sentenceSubject: string) => `
        The ${sentenceSubject} is located outside the the layout viewport.
        ${capitalize(sentenceSubject)}: ${target}
    `,
    elHasWidthOrHeightZero: (target: string, width: number, height: number, sentenceSubject: string) => `
        The ${sentenceSubject} is too small to be visible.
        ${capitalize(sentenceSubject)}: ${target}
        Effective ${sentenceSubject} size: ${width}px x ${height}px`,
    elHasDisplayNone: (target: string, sentenceSubject: string) => `
        The ${sentenceSubject} is invisible. The value of its 'display' property is 'none'.
        ${capitalize(sentenceSubject)}: '${target}'
    `,
    parentHasDisplayNone: (target: string, parent: string, sentenceSubject: string) => `
        The ${sentenceSubject} is invisible. It descends from an element that has the 'display: none' property.
        ${capitalize(sentenceSubject)}: '${target}'
        ${capitalize(sentenceSubject)} ancestor: '${parent}'
    `,
    elHasVisibilityHidden: (target: string, sentenceSubject: string) => `
        The ${sentenceSubject} is invisible. The value of its 'visibility' property is 'hidden'.
        ${capitalize(sentenceSubject)}: '${target}'
    `,
    parentHasVisibilityHidden: (target: string, parent: string, sentenceSubject: string) => `
        The ${sentenceSubject} is invisible. It descends from an element that has the 'visibility: hidden' property.
        ${capitalize(sentenceSubject)}: '${target}'
        ${capitalize(sentenceSubject)} ancestor: '${parent}'
    `,
    elHasVisibilityCollapse: (target: string, sentenceSubject: string) => `
        The ${sentenceSubject} is invisible. The value of its 'visibility' property is 'collapse'.
    `,
    parentHasVisibilityCollapse: (target: string, parent: string, sentenceSubject: string) => `
        The ${sentenceSubject} is invisible. It descends from an element that has the 'visibility: collapse' property.
        ${capitalize(sentenceSubject)}: '${target}'
        ${capitalize(sentenceSubject)} ancestor: '${parent}'
    `,
    elNotRendered: (target: string, sentenceSubject: string) => `
        The ${sentenceSubject} has not been rendered.
        ${capitalize(sentenceSubject)}: ${target}
    `,
    optionNotVisible: (target: string, parent: string, sentenceSubject: string) => `
        The option is invisible. The parent element is collapsed and its length is shorter than 2.
        ${capitalize(sentenceSubject)}: ${target}
        ${capitalize(sentenceSubject)} ancestor: ${parent}
    `,
    mapContainerNotVisible: (target: string, containerHiddenReason: string) => `
        TestCafe cannot interact with the following action target: ${target}
        The action target is invisible because ${containerHiddenReason}
    `,
};
