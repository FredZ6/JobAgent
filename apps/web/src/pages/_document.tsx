import Document, { type DocumentContext, type DocumentInitialProps } from "next/document";
import type { ReactNode } from "react";

type StaticFallbackDocumentProps = DocumentInitialProps & {
  head?: ReactNode[];
};

export default class StaticFallbackDocument extends Document<StaticFallbackDocumentProps> {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    return Document.getInitialProps(ctx);
  }

  render() {
    const { head, html, styles } = this.props;

    return (
      <html lang="en">
        <head>
          {head}
          {styles}
        </head>
        <body>
          <div id="__next" dangerouslySetInnerHTML={{ __html: html }} />
        </body>
      </html>
    );
  }
}
