import {  CellClipBox,  DataCell, Node, SpreadSheet, ViewMeta } from "@antv/s2";
import { FederatedPointerEvent, Image, Line, Polyline, Rect, Text } from '@antv/g';
import {  IS2Options, IValueCell  } from "./type";
import { EmptyKey, EmptyTextColor, getCellKeys } from "./config";

export class MatrixDataCell extends DataCell {
    constructor(viewMeta: ViewMeta, spreadsheet: SpreadSheet) {
        super(viewMeta, spreadsheet);
    }

    private checkedValue: boolean = false;


    private getCheckboxSize() {
        const { x, y, width } = this.getBBoxByType(CellClipBox.CONTENT_BOX);
        const size = 12;
        const cx = x + (width - size) / 2
        const cy = y + (width - size) / 2
        return {
            x: cx,
            y: cy,
            width: size,
            points: [
                [cx + size * 0.25, cy + size * 0.4],
                [cx + size * .5, cy + size * 0.8],
                [cx + size * 0.75, cy + size * 0.2]
            ] as [number, number][]
        }
    }

    private renderCheckBox(checked?: boolean) {
        const { x, y, width, points } = this.getCheckboxSize()

        // checkbox的矩形
        const rect = new Rect({
            name: 'matrix-checkbox',
            style: {
                x,
                y,
                width,
                height: width,
                fill: 'transparent',
                stroke: '#333',
                strokeWidth: 1,
                cursor: 'pointer',
            },
        });

        rect.on('mouseenter',()=> {
            console.log('123')
            rect.style.stroke = '#fff'
        })

        rect.on('mouseleave',()=> {
            rect.style.stroke = '#333'
        })

        let polyline:Polyline|undefined 
        if (checked) {
            // 绘制checkbox的勾勾
             polyline = new Polyline({
                style: {
                    points: points,
                    stroke: '#333',
                    lineWidth: 1,
                },
            });
            rect.appendChild(polyline);
        }

        rect.on('mouseenter',()=> {
            rect.style.stroke = (this.spreadsheet.options as IS2Options).checkboxActiveColor
            if(polyline){
                polyline.style.stroke = (this.spreadsheet.options as IS2Options).checkboxActiveColor
            }
        })

        rect.on('mouseleave',()=> {
            rect.style.stroke = '#333'
            if(polyline){
                polyline.style.stroke = '#333'
            }
        })

        rect.on('click', (e: FederatedPointerEvent) => {
            (this.spreadsheet.options as IS2Options).onCheck?.(...getCellKeys(this.meta as unknown as Node), !this.checkedValue, () => {
                e.stopPropagation()
                // 重新绘制
                this.textShapes.forEach(shape => {
                    this.removeChild(shape)
                })
                this.drawTextShape()
            })
        })
        this.appendChild(rect);
        this.textShapes.push(rect as any)

    }

    renderIcon(srcs: string[]) {
        const { x, y, width, height } = this.getBBoxByType(CellClipBox.BORDER_BOX);
        const size = (this.spreadsheet.options as IS2Options)?.cellIconSize ?? 12
        if (!srcs.length) return
        const imageStyle = {
            x: x - 4,
            y: y + height / 2 - size / 2,
            width: size,
            height: size,
            src: srcs[0],
        }
        if (srcs.length == 1) {
            imageStyle.x = x + width / 2 - size / 2
        } else {
            imageStyle.x = x + width / 2 - size

            const imageStyle2 = {
                ...imageStyle,
                x: x + width / 2 + 2,
                src: srcs[1],
            }
            const shape = new Image({
                style: imageStyle2,
            })
            this.appendChild(shape);
            this.textShapes.push(shape as any)
        }
        const shape = new Image({
            style: imageStyle,
        })
        this.appendChild(shape);
        this.textShapes.push(shape as any)
    }



    private drawText(text: string, width: number, height: number, x: number, y: number,isEmpty?: boolean) {
        const fontSize = this.spreadsheet.theme.dataCell.text.fontSize
        let startX = 10;
        const textCount = Math.floor((width - startX * 2) / fontSize)

        if (this.spreadsheet.theme.dataCell.text.textAlign === 'center' || isEmpty) {
            if (textCount > text.length - 1) {
                startX = startX + width / 2 - fontSize * text.length / 2
            }
        }

        for (let i = 0; i < textCount - 1; i++) {
            const textShape = new Text({
                style: {
                    x: startX + x + i * fontSize,
                    y: y + height / 2,
                    text: text[i],
                    ...this.spreadsheet.theme.colCell.text,
                    lineWidth: 5,
                    maxLines: 1,
                    textAlign: 'center',
                    fill: isEmpty ? EmptyTextColor : this.spreadsheet.theme.colCell.text.fill,
                },
            });
            this.appendChild(textShape);
            this.textShapes.push(textShape as any)

        }
        if (textCount < text.length - 1) {
            const text = new Text({
                style: {
                    x: startX + x + (textCount - 1) * fontSize,
                    y: y + height / 2,
                    text: '...',
                    ...this.spreadsheet.theme.colCell.text,
                    lineWidth: 5,
                    maxLines: 1,
                    textAlign: 'center',
                    fill: isEmpty ? EmptyTextColor : this.spreadsheet.theme.colCell.text.fill,
                },
            });
            this.appendChild(text);
            this.textShapes.push(text as any)

        }

    }

    private drawEmtpy() {
        const emptyText = (this.spreadsheet.options as IS2Options).emptyDataText
        const { x, y, width, height } = this.getBBoxByType(CellClipBox.BORDER_BOX)
        if (!emptyText) {
            const line = new Line({
                style: {
                    x1: x,
                    y1: y,
                    x2: x+width,
                    y2: y+height,
                    lineWidth: 1,
                    stroke: this.spreadsheet.theme.cornerCell.cell.horizontalBorderColor,
                },
            });

            const line2 = new Line({
                style: {
                    x1: x,
                    y1: y + height,
                    x2: x + width,
                    y2: y,
                    lineWidth: 1,
                    stroke: this.spreadsheet.theme.cornerCell.cell.horizontalBorderColor,
                },
            });
            this.appendChild(line);
            this.appendChild(line2);
        }else {
            this.drawText(emptyText, width, height, x, y,true)
        }

    }


    override drawTextShape(): void {
        if (this.meta.id.includes(EmptyKey)) {
            // 渲染单元格为空的
            this.drawEmtpy()
            return
        }
        const renderCell = (this.spreadsheet.options as IS2Options)?.renderCell
        // 默认渲染
        if (renderCell == undefined || this.meta == undefined) {
            super.drawTextShape();
            return
        }


        // 自定义渲染
        const value = renderCell(...getCellKeys(this.meta as unknown as Node)) as IValueCell

        if (value.type == 'checkbox') {
            this.checkedValue = value.value
            this.renderCheckBox(value.value)
        } else if (value.type == 'image') {
            this.renderIcon(Array.isArray(value.value) ? value.value : [value.value])
        } else if (value.type == 'empty') {
            
        } else {
            const { width, height, x, y } = this.getBBoxByType(CellClipBox.BORDER_BOX)
            this.drawText(value.value, width, height, x, y)
        }
        if (value.disabled) {
            // @ts-ignore
            this.backgroundShape.setAttribute('fill', '#dadde1');
        } else {
            // @ts-ignore
            this.backgroundShape.setAttribute('fill', '#fff');

        }
    }




} 