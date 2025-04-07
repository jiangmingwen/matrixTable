import { ColCell, SpreadSheet, Node, CellClipBox } from "@antv/s2";
import { ICellMount, IHeaderData,  IS2Options, MatrixField } from "./type";
import { Line, LineStyleProps, Image, Rect, Text, FederatedPointerEvent } from "@antv/g";
import { CollapseIconSize, EmptyKey, EmptyTextColor, HeaderPadding } from "./config";


/** 自定义列表头渲染 */
export class MatrixColCell extends ColCell {

    constructor(mountData: ICellMount, meta: Node, spreadsheet: SpreadSheet, ...rest: any[]) {
        super({ ...meta, extra: { ...meta.extra, mountData } } as unknown as Node, spreadsheet, ...rest)
    }

    get fontSize() {
        return this.spreadsheet.theme.colCell.text.fontSize
    }

    get showLine() {
        return (this.spreadsheet.options as IS2Options).showLine ?? true
    }

    get headerData() {
        return this.meta.extra.mountData?.headerData
    }

    get onCollapse() {
        return this.meta.extra.mountData?.onCollpase as (e: FederatedPointerEvent,spreadsheet: SpreadSheet) => void
    }

    hignlight(color?: string){
        this.textShapes.forEach((text) => {
            text.attr('fill',color?? EmptyTextColor)
        })
    }

    hideHignlight(){
        this.textShapes.forEach((text) => {
            text.attr('fill', this.spreadsheet.theme.rowCell.text.fill)
        })
    }

    get isCollapse() {
        return !!(this.spreadsheet.options as IS2Options).colCollapseKeyMap![this.meta.value]
    }

    get isShowCount() {
        return !!(this.spreadsheet.options as IS2Options).showCount
    }

    private drawText(headerData: IHeaderData, width: number, height: number, _x: number, y: number) {
        // 文字的个数
        // 一个parent递进1个字符
        const parentList = !!headerData.parentKeys ? headerData.parentKeys.split('-') : [];
        let startY = HeaderPadding + (headerData.childrenCount ? CollapseIconSize : 0) + (parentList.length + 1) * this.fontSize - 2

        const x = _x + width / 2 - 2;
        const icon = (this.spreadsheet.options as IS2Options)?.renderHeaderIcon?.(this.meta.value, this.meta.value)
        if (icon) {
            const iconSize = (this.spreadsheet.options as IS2Options)?.headerIconSize ?? 12
            // 需要绘制图标
            const image = new Image({
                style: {
                    x: x - 4,
                    y: startY - 2,
                    width: iconSize,
                    height: iconSize,
                    src: icon,
                },
            });
            startY += iconSize
            this.appendChild(image);
        }
        const textCount = Math.floor((height - startY - HeaderPadding) / this.fontSize)


        for (let i = 0; i < textCount; i++) {
            const text = new Text({
                style: {
                    x: x,
                    y: y + (i + 1) * this.fontSize + startY,
                    text: headerData.title[i],
                    ...this.spreadsheet.theme.colCell.text,
                    lineWidth: 5,
                    maxLines: 1,
                    textAlign: 'center'
                },
            });
            this.appendChild(text);
            this.textShapes.push(text as any) 
        }

        if (textCount < headerData.title.length) {
            const text = new Text({
                style: {
                    x: x,
                    y: y + (textCount + 1) * this.fontSize + startY - 2,
                    text: '...',
                    ...this.spreadsheet.theme.colCell.text,
                    lineWidth: 5,
                    maxLines: 1,
                    textAlign: 'center'
                },
            });
            this.appendChild(text);
            this.textShapes.push(text as any)
        }

    }

    private drawLine(headerData: IHeaderData, width: number, _height: number, x: number, _y: number) {
        if (!this.showLine) return
        const parentList = !!headerData.parentKeys ? headerData.parentKeys.split('-') : [];
        const startY = HeaderPadding + CollapseIconSize / 2
        const style: LineStyleProps = {
            x1: x,
            y1: startY,
            x2: x + width,
            y2: startY,
            lineWidth: 1,
            lineDash: [2, 2],
            stroke: '#333333',
            zIndex: 1
        }
        /** 第一列 */
        const isFirst = x === 0
        // 展示数量的时候，nodes为双倍，需要除以2
        const isLast = x === (this.headerConfig.nodes.length/(this.isShowCount?2:1) - 1) * width

        if (isFirst) {
            // 第一列
            style.x1 = x + width / 2
        }
        if (isLast) {
            // 最后一列
            style.x2 = x + width / 2
        }

        if (!headerData.parentKeys && !!headerData.childrenCount) {
            //  如果有折叠图标

            if (isFirst) {
                // 第一列
                style.x1 = x + width / 2 + CollapseIconSize / 2
                style.x2 = x + width
            } else if (isLast) {
                // 最后一列
                style.x1 = x
                style.x2 = x + width / 2 - CollapseIconSize / 2
            } else {
                style.x1 = x
                style.x2 = x + width / 2 - CollapseIconSize / 2

                const style2 = {
                    ...style,
                    x1: x + width / 2 + CollapseIconSize / 2,
                    x2: x + width,
                }

                const line2 = new Line({
                    style: style2,
                });
                this.appendChild(line2);
            }

        }
        const line1 = new Line({
            style,
        });
        this.appendChild(line1);

        const style2 = {
            ...style,
        }
        style2.x1 = x + width / 2
        style2.y1 = startY + 1
        style2.x2 = x + width / 2
        style2.y2 = startY + parentList.length * this.fontSize + 1
        if (!!headerData.parentKeys && !!headerData.childrenCount) {
            style2.y2 -= CollapseIconSize / 2
        }

        // 第一个
        const line2 = new Line({
            style: style2,
        });

        this.appendChild(line2);
    }


    private drawCollapseIcon(headerData: IHeaderData, width: number, _height: number, _x: number, _y: number): void {
        if (!headerData.childrenCount) return

        const parentList = !!headerData.parentKeys ? headerData.parentKeys.split('-') : [];
        const startY = parentList.length * this.fontSize
        const x = _x + width / 2 - CollapseIconSize / 2
        const y = _y + startY + HeaderPadding
        const rect = new Rect({
            style: {
                x,
                y,
                width: CollapseIconSize,
                height: CollapseIconSize,
                fill: '#fff',
                stroke: '#333',
                strokeWidth: 1,
                cursor: 'pointer',
            },
            zIndex: 2
        });

        const line1 = new Line({
            style: {
                x1: x + CollapseIconSize * .2,
                y1: y + CollapseIconSize / 2,
                x2: x + CollapseIconSize * .8,
                y2: y + CollapseIconSize / 2,
                lineWidth: 1,
                stroke: '#333',
                zIndex: 2
            },
        });
        if(this.isCollapse) {
            const line2 = new Line({
                style: {
                    x1: x + CollapseIconSize / 2,
                    y1: y + CollapseIconSize * .2,
                    x2: x + CollapseIconSize /2,
                    y2: y + CollapseIconSize * .8,
                    lineWidth: 1,
                    stroke: '#333',
                    zIndex: 2
                },
            });
            rect.appendChild(line2);
        }

        rect.appendChild(line1);
        this.appendChild(rect);
        rect.on('click', (e: FederatedPointerEvent) => {
            ;(this.spreadsheet.options as IS2Options).colCollapseKeyMap![this.meta.value] = !this.isCollapse
            this.onCollapse(e,this.spreadsheet)
        })
    }

    get isCountCell() {
        return this.meta.field === MatrixField.ColCountField
    }

    private drawCountText(_headerData: IHeaderData, width: number, height: number, x: number, y: number): void {
        const renderCount = (this.spreadsheet.options as IS2Options)?.renderCount?.(this.meta.query?.[MatrixField.ColunmField], this.meta.query?.[MatrixField.ColunmField])
        if (renderCount == undefined) return
        const title = `${renderCount ?? 0}`
        const text = new Text({
            style: {
                x: x + width / 2 - (title.length - 1) * this.fontSize / 2,
                y: y + height / 2 + this.fontSize,
                text: title,
                ...this.spreadsheet.theme.colCell.text,
                maxLines: 1,
                textAlign: 'initial'
            },
        });
        this.appendChild(text);
    }


    private drawEmptyText(text: string, width: number, height: number, x: number, y: number) {
        const fontSize = this.spreadsheet.theme.dataCell.text.fontSize
        let startX = 10 +  width / 2 - fontSize * text.length / 2;
        for (let i = 0; i < text.length ; i++) {
            const textShape = new Text({
                style: {
                    x: startX + x + i * fontSize,
                    y: y + height / 2,
                    text: text[i],
                    ...this.spreadsheet.theme.colCell.text,
                    lineWidth: 5,
                    maxLines: 1,
                    textAlign: 'center',
                    fill: EmptyTextColor
                },
            });
            this.appendChild(textShape);
        }
    }

    private drawEmtpy(  width: number, height: number, x: number, y: number) {
        const emptyText = (this.spreadsheet.options as IS2Options).emptyColHeaderText ?? '暂无数据'
        this.drawEmptyText(emptyText, width, height, x, y)
    }

    override drawTextShape(): void {
        const data = this.headerData
        
        const { x, y, height, width } = this.getBBoxByType(CellClipBox.BORDER_BOX);
        if (this.meta.field === MatrixField.ColCountField) {
            this.drawCountText(data, width, height, x, y)
            return
        }else {
            if(this.meta.value === EmptyKey) {
                this.drawEmtpy(width, height, x, y)
                return
            }
        }
        if (!data) return

        this.drawLine(data, width, height, x, y)
        this.drawText(data, width, height, x, y)
        this.drawCollapseIcon(data, width, height, x, y)
    }
}
