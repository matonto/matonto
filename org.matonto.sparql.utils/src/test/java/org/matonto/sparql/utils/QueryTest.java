package org.matonto.sparql.utils;

/*-
 * #%L
 * org.matonto.sparql.query
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import static org.junit.Assert.assertEquals;

import org.antlr.v4.runtime.BaseErrorListener;
import org.antlr.v4.runtime.RecognitionException;
import org.antlr.v4.runtime.Recognizer;
import org.antlr.v4.runtime.TokenStream;
import org.antlr.v4.runtime.TokenStreamRewriter;
import org.antlr.v4.runtime.tree.ParseTreeWalker;
import org.apache.commons.io.IOUtils;
import org.junit.Test;

import java.io.IOException;
import java.io.InputStream;

public class QueryTest {

    private final String DATASET_REPLACEMENT = "FROM<test:iri>";

    @Test
    public void parseSimpleQuery() throws Exception {
        InputStream query = getClass().getResourceAsStream("/example1.rq");
        Sparql11Parser parser = Query.getParser(streamToString(query));
        parser.addErrorListener(new BaseErrorListener() {
            @Override
            public void syntaxError(Recognizer<?, ?> recognizer, Object offendingSymbol, int line, int charPositionInLine, String msg, RecognitionException e) {
                throw new IllegalStateException("failed to parse at line " + line + " due to " + msg, e);
            }
        });
        parser.query();
    }

    @Test
    public void replaceDatasetClause() throws Exception {
        InputStream query = getClass().getResourceAsStream("/example2.rq");
        Sparql11Parser parser = Query.getParser(streamToString(query));
        parser.addErrorListener(new BaseErrorListener() {
            @Override
            public void syntaxError(Recognizer<?, ?> recognizer, Object offendingSymbol, int line, int charPositionInLine, String msg, RecognitionException e) {
                throw new IllegalStateException("failed to parse at line " + line + " due to " + msg, e);
            }
        });

        Sparql11Parser.QueryContext queryContext = parser.query();

        // Rewrite the dataset clause
        TokenStreamRewriter rewriter = new TokenStreamRewriter(parser.getTokenStream());
        ParseTreeWalker walker = new ParseTreeWalker();
        DatasetListener listener = new DatasetListener(rewriter);
        walker.walk(listener, queryContext);

        // Test result
        String newText = rewriter.getText();
        parser = Query.getParser(newText);
        String datasetText = parser.query().selectQuery().datasetClause().get(0).getText();
        assertEquals(DATASET_REPLACEMENT, datasetText);
    }

    @Test
    public void insensitiveToCase() throws Exception {
        String queryString = "select * WHERE { ?x ?Y ?z }";
        String queryNoSpaces = "select*WHERE{?x?Y?z}";
        Sparql11Parser parser = Query.getParser(queryString);
        TokenStream tokens = parser.getTokenStream();
        parser.addErrorListener(new BaseErrorListener() {
            @Override
            public void syntaxError(Recognizer<?, ?> recognizer, Object offendingSymbol, int line, int charPositionInLine, String msg, RecognitionException e) {
                throw new IllegalStateException("failed to parse at line " + line + " due to " + msg, e);
            }
        });

        assertEquals(queryNoSpaces, parser.query().selectQuery().getText());
        assertEquals(queryString, tokens.getText());
    }

    @Test
    public void insensitiveToCaseBuiltInCall() throws Exception {
        String queryString = "select * WHERE { ?s ?P ?o FILTeR (sameTeRm(?s, ?o))}";
        Sparql11Parser parser = Query.getParser(queryString);
        TokenStream tokens = parser.getTokenStream();
        parser.addErrorListener(new BaseErrorListener() {
            @Override
            public void syntaxError(Recognizer<?, ?> recognizer, Object offendingSymbol, int line, int charPositionInLine, String msg, RecognitionException e) {
                throw new IllegalStateException("failed to parse at line " + line + " due to " + msg, e);
            }
        });

        parser.query();
        assertEquals(queryString, tokens.getText());
    }

    private String streamToString(InputStream inputStream) throws IOException {
        return IOUtils.toString(inputStream, "UTF-8");
    }

    private class DatasetListener extends Sparql11BaseListener {

        TokenStreamRewriter rewriter;

        DatasetListener(TokenStreamRewriter rewriter) {
            this.rewriter = rewriter;
        }

        @Override
        public void enterDatasetClause(Sparql11Parser.DatasetClauseContext ctx) {
            rewriter.replace(ctx.getStart(), ctx.getStop(), DATASET_REPLACEMENT);
        }
    }
}
