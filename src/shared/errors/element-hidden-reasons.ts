const capitalize = function (originalInput: string): string {
    return originalInput.charAt(0).toUpperCase() + originalInput.slice(1);
};

export default {
    getDynamicText: (target: string, isRecursive = false): {
        introduction: string,
        sentenceSubject: string,
        containerElementPlaceholder: string
    } => {
        return {
            introduction:                isRecursive ? '' : `TestCafe cannot interact with the following action target: ${target}`,
            sentenceSubject:             isRecursive ? 'container' : 'action target',
            containerElementPlaceholder: isRecursive ? `Container: ${target} \n` : '',
        };
    },
    chainMessage: (originalInput:string) => {
        originalInput = originalInput.trimStart();
        return originalInput.replace(/The/, 'its') || '';
    },
    notElementOrTextNode: () => `
        TestCafe cannot interact with the action target.
        The action target is neither a DOM element nor a text node.
    `,
    elOutsideBounds: (target: string) => `
        TestCafe cannot interact with the following action target: ${target}
        The action target is located outside the the layout viewport.
    `,
    elHasWidthOrHeightZero: (width: number, height: number, sentenceSubject: string, introduction: string, containerElementPlaceholder: string) => `
        ${introduction} 
        The ${sentenceSubject} is too small to be visible.
        ${containerElementPlaceholder} Effective ${sentenceSubject} size: ${width}px x ${height}px
    `,
    elHasDisplayNone: (sentenceSubject: string, introduction: string, containerElementPlaceholder: string) => `
        ${introduction}
        The ${sentenceSubject} is invisible. The value of its 'display' property is 'none'.
        ${containerElementPlaceholder}
    `,
    parentHasDisplayNone: (parent: string, sentenceSubject: string, introduction: string, containerElementPlaceholder: string) => `
        ${introduction}
        The ${sentenceSubject} is invisible. It descends from an element that has the 'display: none' property.
        ${containerElementPlaceholder} ${capitalize(sentenceSubject)} ancestor: '${parent}'
    `,
    elHasVisibilityHidden: (sentenceSubject: string, introduction: string, containerElementPlaceholder: string) => `
        ${introduction}
        The ${sentenceSubject} is invisible. The value of its 'visibility' property is 'hidden'. ${containerElementPlaceholder}
    `,
    parentHasVisibilityHidden: (parent: string, sentenceSubject: string, introduction: string, containerElementPlaceholder: string) => `
        ${introduction}
        The ${sentenceSubject} is invisible. It descends from an element that has the 'visibility: hidden' property.
        ${containerElementPlaceholder} ${capitalize(sentenceSubject)} ancestor: '${parent}'
    `,
    elHasVisibilityCollapse: (sentenceSubject: string, introduction: string, containerElementPlaceholder: string) => `
        ${introduction}
        The ${sentenceSubject} is invisible. The value of its 'visibility' property is 'collapse'. ${containerElementPlaceholder}
    `,
    parentHasVisibilityCollapse: (parent: string, sentenceSubject: string, introduction: string, containerElementPlaceholder: string) => `
        ${introduction}
        The ${sentenceSubject} is invisible. It descends from an element that has the 'visibility: collapse' property.
        ${containerElementPlaceholder} ${capitalize(sentenceSubject)} ancestor: '${parent}'
    `,
    elNotRendered: (sentenceSubject: string, introduction: string, containerElementPlaceholder: string) => `
        ${introduction}
        The ${sentenceSubject} has not been rendered. ${containerElementPlaceholder}
    `,
    optionNotVisible: (parent: string, sentenceSubject: string, introduction: string, containerElementPlaceholder: string) => `
        ${introduction}
        The option is invisible. The parent element is collapsed and its length is shorter than 2.
        ${containerElementPlaceholder} ${capitalize(sentenceSubject)} ancestor: ${parent}
    `,
    mapContainerNotVisible: (target: string, containerHiddenReason: string) => `
        TestCafe cannot interact with the following action target: ${target}
        The action target is invisible because ${containerHiddenReason}
    `,
};
