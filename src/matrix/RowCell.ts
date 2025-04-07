import { RowCell, SpreadSheet, Node, CellClipBox } from "@antv/s2";
import { ICellMount, IHeaderData, IHeaderDataMap, IS2Options, MatrixField } from "./type";
import { CollapseIconSize, EmptyKey, EmptyTextColor, HeaderPadding } from "./config";
import { LineStyleProps, Line, Rect, Text, Image, FederatedPointerEvent } from "@antv/g";

export class MatrixRowCell extends RowCell {

    constructor(mountData: ICellMount, meta: Node, spreadsheet: SpreadSheet, ...rest: any[]) {
        super({ ...meta, extra: { ...meta.extra, mountData } } as unknown as Node, spreadsheet, ...rest)
    }

    get fontSize() {
        return this.spreadsheet.theme.colCell.text.fontSize
    }

    get showLine() {
        return (this.spreadsheet.options.style?.colCell as any).showLine as number ?? true
    }


    get headerData() {
        return this.meta.extra.mountData?.headerData
    }


    get onCollapse() {
        return this.meta.extra.mountData?.onCollpase as (e: FederatedPointerEvent, spreadsheet: SpreadSheet) => void
    }

    get isCollapse() {
        return !!(this.spreadsheet.options as IS2Options).rowCollapseKeyMap![this.meta.value]
    }


    get isShowCount() {
        return !!(this.spreadsheet.options as IS2Options).showCount
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

    private drawText(headerData: IHeaderData, width: number, height: number, _x: number, y: number) {
        // 文字的个数
        const parentList = !!headerData.parentKeys ? headerData.parentKeys.split('-') : [];
        // 一个parent递进1个字符
        let startX = _x + HeaderPadding + (headerData.childrenCount ? CollapseIconSize : 0) + (parentList.length) * this.fontSize - 2

        const icon = (this.spreadsheet.options as IS2Options)?.renderHeaderIcon?.(this.meta.value, this.meta.value)
        if (icon) {
            const iconSize = (this.spreadsheet.options as IS2Options)?.headerIconSize ?? 12
            // 需要绘制图标
            const image = new Image({
                style: {
                    x: startX + 8,
                    y: y + height / 2 - iconSize / 2,
                    width: iconSize,
                    height: iconSize,
                    src: icon,
                },
            });
            startX += iconSize
            this.appendChild(image);
        }
        const textCount = Math.floor((width - startX - HeaderPadding) / this.fontSize)

        for (let i = 0; i < textCount - 1; i++) {
            const text = new Text({
                style: {
                    x: startX + (i + 1) * this.fontSize,
                    y: y + height / 2 - this.fontSize - 3,
                    text: headerData.title[i],
                    ...this.spreadsheet.theme.rowCell.text,
                    lineWidth: 5,
                    maxLines: 1,
                    textAlign: 'center',
                    textBaseline: 'initial'
                },
            });
            this.appendChild(text);
            this.textShapes.push(text as any) 
        }

        if (textCount < headerData.title.length - 1) {
            const text = new Text({
                style: {
                    x: startX + (textCount) * this.fontSize,
                    y: y + height / 2 - this.fontSize - 4,
                    text: '...',
                    ...this.spreadsheet.theme.rowCell.text,
                    lineWidth: 5,
                    textAlign: 'center',
                    textBaseline: 'initial'
                },
            });
            this.textShapes.push(text as any) 
            this.appendChild(text);
        }

    }

    private drawLine(headerData: IHeaderData, _width: number, height: number, x: number, y: number) {

        if (!this.showLine) return
        const parentList = !!headerData.parentKeys ? headerData.parentKeys.split('-') : [];
        const startX = HeaderPadding + CollapseIconSize / 2
        const style: LineStyleProps = {
            x1: startX,
            y1: y,
            x2: startX,
            y2: y + height,
            lineWidth: 1,
            lineDash: [2, 2],
            stroke: '#333333',
            zIndex: 1
        }
        /** 第一列 */
        const isFirst = y === 0
        // 展示数量的时候，nodes为双倍，需要除以2
        const isLast = y === (this.headerConfig.nodes.length / (this.isShowCount ? 2 : 1) - 1) * height

        if (isFirst) {
            // 第一行
            style.y1 = y + height / 2
        }
        if (isLast) {
            // 最后一行
            style.y2 = y + height / 2
        }

        if (!headerData.parentKeys && !!headerData.childrenCount) {
            //  如果有折叠图标
            if (isFirst) {
                // 第一行
                style.y1 = y + height / 2 + CollapseIconSize / 2
                style.y2 = x + height
            } else if (isLast) {
                // 最后一列
                style.y1 = y
                style.y2 = y + height / 2 - CollapseIconSize / 2
            } else {
                style.y1 = y
                style.y2 = y + height / 2 - CollapseIconSize / 2

                const style2 = {
                    ...style,
                    y1: y + height / 2 + CollapseIconSize / 2,
                    y2: y + height,
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
        style2.y1 = y + height / 2
        style2.x1 = startX + 1
        style2.y2 = y + height / 2
        style2.x2 = startX + parentList.length * this.fontSize + 1
        if (!!headerData.parentKeys && !!headerData.childrenCount) {
            style2.x2 -= CollapseIconSize / 2
        }

        // 第一个
        const line2 = new Line({
            style: style2,
        });

        this.appendChild(line2);
    }


    private drawCollapseIcon(headerData: IHeaderData, _width: number, _height: number, _x: number, _y: number): void {
        if (!headerData.childrenCount) return

        const parentList = !!headerData.parentKeys ? headerData.parentKeys.split('-') : [];
        const startX = parentList.length * this.fontSize

        const x = _x + startX + HeaderPadding
        const y = _y + + _height / 2 - CollapseIconSize / 2

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

        if (this.isCollapse) {
            const line2 = new Line({
                style: {
                    x1: x + CollapseIconSize / 2,
                    y1: y + CollapseIconSize * .2,
                    x2: x + CollapseIconSize / 2,
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
            ; (this.spreadsheet.options as IS2Options).rowCollapseKeyMap![this.meta.value] = !this.isCollapse
            this.onCollapse(e, this.spreadsheet)
        })
    }

    private drawCountText(_headerData: IHeaderData, width: number, height: number, x: number, y: number): void {
        const renderCount = (this.spreadsheet.options as IS2Options)?.renderCount?.(this.meta.query?.[this.meta.value], this.meta.query?.[this.meta.value])
        if (renderCount == undefined) return
        const title = `${renderCount ?? 0}`
        const text = new Text({
            style: {
                x: x + width / 2 - (title.length - 1) * this.fontSize / 2,
                y: y + height / 2 + this.fontSize,
                text: title,
                fontSize: this.fontSize,
                maxLines: 1,
                textAlign: 'initial'
            },
        });
        this.appendChild(text);

    }

    private drawEmptyText(text: string, width: number, height: number, x: number, y: number) {
        let startY = y + (height - text.length * this.fontSize)/2;
        for (let i = 0; i < text.length; i++) {
            const textShape = new Text({
                style: {
                    x: x + width /2,
                    y: startY + (i + 1) * this.fontSize,
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

    private drawEmtpy(width: number, height: number, x: number, y: number) {
        const emptyText = (this.spreadsheet.options as IS2Options).emptyRowHeaderText ?? '暂无数据'
        this.drawEmptyText(emptyText, width, height, x, y)
    }


    override drawTextShape(): void {
        const data = this.headerData
        const { x, y, height, width } = this.getBBoxByType(CellClipBox.BORDER_BOX);
        if (this.meta.field === MatrixField.RowCountField) {
            this.drawCountText(data, width, height, x, y)
            return
        } else {
            if (this.meta.value === EmptyKey) {
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
