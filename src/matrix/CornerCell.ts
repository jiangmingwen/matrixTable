import {  Group,  Line, Rect, Text, Image } from "@antv/g";
import { CornerHeader, SpreadSheet } from "@antv/s2";
import { ICorCellContent, IS2Options } from "./type";

/** 自定义角头单元格 */
export class MatrixCornerHeader extends Group {
    header: CornerHeader;
    spreadsheet: SpreadSheet


    constructor(header: CornerHeader, spreadsheet: SpreadSheet) {
        super({});
        this.header = header;
        this.spreadsheet = spreadsheet;
        this.initCornerHeader();
    }

    initCornerHeader() {
        this.initBg();
        this.renderCell();
        this.header.on('mouseenter', () => {
            this.spreadsheet.hideTooltip()
        })
    }

    initBg() {
        const { width, height } = this.header.getHeaderConfig();
        const rect = new Rect({
            style: {
                x: 0,
                y: 0,
                width,
                height,
                fill: this.spreadsheet.theme.cornerCell.cell.backgroundColor,
            },
            zIndex: 1000
        });
        this.header.appendChild(rect);
    }

    renderCell() {
        const { width, height } = this.header.getHeaderConfig();
        const cornerValue = (this.spreadsheet.options as IS2Options).renderCornerCell?.()
        if (!cornerValue) return
        if (cornerValue.type === 'corner') {
            this.drawCornerLine()
            this.renderText(cornerValue.text[0], width * 0.3, height * 0.8)
            this.renderText(cornerValue.text[1], width * 0.7, height * .3)
        } else if (cornerValue.type === 'iconText') {
            const startY = this.getStartPoint(cornerValue.rowCount, cornerValue.lineHeight)
            for (let i = 0; i < cornerValue.text.length; i++) {
                this.renderIconText(cornerValue.text[i], cornerValue.rowCount, cornerValue.colCount, i, startY, cornerValue.lineHeight, cornerValue.gap)
            }
        }
    }

    private getStartPoint(rowCount: number = 2, lineHeight = 16) {
        const {  height } = this.header.getHeaderConfig();
        let startY = height / 2;

        if (rowCount) {
            startY = (height - (rowCount * lineHeight)) / 2;
        }

        return startY

    }

    private renderIconText(cellValue: string | ICorCellContent, rowCount: number = 2, _colCount: number = 2, index: number, startY: number, lineHeight: number = 20, gap = 16) {
        const { width } = this.header.getHeaderConfig();
        const interval = width * .1;
        const perWidth = (width * 0.8 - (rowCount - 1) * gap) / rowCount
        if (typeof cellValue === 'string') {
            this.renderText(cellValue, interval + (index + 1) % rowCount * (perWidth + gap), startY + (Math.floor(index / rowCount) + 1) * lineHeight)
        } else {
            const iconSize = (this.spreadsheet.options as IS2Options)?.headerIconSize ?? 12
            const image = new Image({
                style: {
                    x: interval + (index + 1) % rowCount * (perWidth + gap),
                    y: startY + (Math.floor(index / rowCount) + 1) * lineHeight - iconSize/2,
                    width: iconSize,
                    height: iconSize,
                    src: cellValue.icon,
                },
            });
            this.header.appendChild(image);
            this.renderText(cellValue.text, interval + (index + 1) % rowCount * (perWidth + gap) + iconSize, startY + (Math.floor(index / rowCount) + 1) * lineHeight)

        }
    }


    private renderText(text: string, x: number, y: number) {
        const textShape = new Text({
            style: {
                x,
                y,
                ... this.spreadsheet.theme.cornerCell.text,
                text,
                maxLines: 1,
                textAlign: 'initial',
            },
        });
        this.header.appendChild(textShape);
    }



    /** 绘制斜对角线 */
    private drawCornerLine() {
        const { width, height } = this.header.getHeaderConfig();
        const line = new Line({
            style: {
                x1: 0,
                y1: 0,
                x2: width,
                y2: height,
                lineWidth: 1,
                stroke: this.spreadsheet.theme.cornerCell.cell.horizontalBorderColor,
            },
        });
        this.header.appendChild(line);
    }
}