package org.matonto.catalog.impl;

/*-
 * #%L
 * org.matonto.catalog.impl
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


import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.apache.commons.io.IOUtils;
import org.matonto.catalog.api.CatalogUtilsService;
import org.matonto.catalog.api.builder.Difference;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.BranchFactory;
import org.matonto.catalog.api.ontologies.mcat.Catalog;
import org.matonto.catalog.api.ontologies.mcat.CatalogFactory;
import org.matonto.catalog.api.ontologies.mcat.Commit;
import org.matonto.catalog.api.ontologies.mcat.CommitFactory;
import org.matonto.catalog.api.ontologies.mcat.Distribution;
import org.matonto.catalog.api.ontologies.mcat.DistributionFactory;
import org.matonto.catalog.api.ontologies.mcat.GraphRevision;
import org.matonto.catalog.api.ontologies.mcat.GraphRevisionFactory;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommit;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommitFactory;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.catalog.api.ontologies.mcat.RecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Revision;
import org.matonto.catalog.api.ontologies.mcat.RevisionFactory;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecord;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Version;
import org.matonto.catalog.api.ontologies.mcat.VersionFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecordFactory;
import org.matonto.exception.MatOntoException;
import org.matonto.persistence.utils.Bindings;
import org.matonto.persistence.utils.RepositoryResults;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;
import javax.annotation.Nullable;

@Component(
        immediate = true,
        name = SimpleCatalogUtilsService.COMPONENT_NAME
)
public class SimpleCatalogUtilsService implements CatalogUtilsService {
    static final String COMPONENT_NAME = "org.matonto.catalog.api.CatalogUtilsService";
    private ModelFactory mf;
    private ValueFactory vf;
    private CatalogFactory catalogFactory;
    private RecordFactory recordFactory;
    private UnversionedRecordFactory unversionedRecordFactory;
    private VersionedRecordFactory versionedRecordFactory;
    private VersionedRDFRecordFactory versionedRDFRecordFactory;
    private DistributionFactory distributionFactory;
    private VersionFactory versionFactory;
    private BranchFactory branchFactory;
    private CommitFactory commitFactory;
    private RevisionFactory revisionFactory;
    private GraphRevisionFactory graphRevisionFactory;
    private InProgressCommitFactory inProgressCommitFactory;

    private static final String GET_IN_PROGRESS_COMMIT;
    private static final String GET_COMMIT_CHAIN;
    private static final String USER_BINDING = "user";
    private static final String PARENT_BINDING = "parent";
    private static final String RECORD_BINDING = "record";
    private static final String COMMIT_BINDING = "commit";

    static {
        try {
            GET_IN_PROGRESS_COMMIT = IOUtils.toString(
                    SimpleCatalogUtilsService.class.getResourceAsStream("/get-in-progress-commit.rq"),
                    "UTF-8"
            );
            GET_COMMIT_CHAIN = IOUtils.toString(
                    SimpleCatalogUtilsService.class.getResourceAsStream("/get-commit-chain.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
    }

    @Reference
    protected void setMf(ModelFactory mf) {
        this.mf = mf;
    }

    @Reference
    protected void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    protected void setCatalogFactory(CatalogFactory catalogFactory) {
        this.catalogFactory = catalogFactory;
    }

    @Reference
    protected void setRecordFactory(RecordFactory recordFactory) {
        this.recordFactory = recordFactory;
    }

    @Reference
    protected void setUnversionedRecordFactory(UnversionedRecordFactory unversionedRecordFactory) {
        this.unversionedRecordFactory = unversionedRecordFactory;
    }

    @Reference
    protected void setVersionedRecordFactory(VersionedRecordFactory versionedRecordFactory) {
        this.versionedRecordFactory = versionedRecordFactory;
    }

    @Reference
    protected void setVersionedRDFRecordFactory(VersionedRDFRecordFactory versionedRDFRecordFactory) {
        this.versionedRDFRecordFactory = versionedRDFRecordFactory;
    }

    @Reference
    protected void setDistributionFactory(DistributionFactory distributionFactory) {
        this.distributionFactory = distributionFactory;
    }

    @Reference
    protected void setVersionFactory(VersionFactory versionFactory) {
        this.versionFactory = versionFactory;
    }

    @Reference
    protected void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference
    protected void setInProgressCommitFactory(InProgressCommitFactory inProgressCommitFactory) {
        this.inProgressCommitFactory = inProgressCommitFactory;
    }

    @Reference
    protected void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Reference
    protected void setRevisionFactory(RevisionFactory revisionFactory) {
        this.revisionFactory = revisionFactory;
    }

    @Reference
    protected void setGraphRevisionFactory(GraphRevisionFactory graphRevisionFactory) {
        this.graphRevisionFactory = graphRevisionFactory;
    }

    @Override
    public void validateResource(Resource resource, IRI classId, RepositoryConnection conn) {
        if (!conn.contains(resource, vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI), classId, resource)) {
            throw new IllegalArgumentException(classId.getLocalName() + " " + resource + " could not be found");
        }
    }

    @Override
    public <T extends Thing> void addObject(T object, RepositoryConnection conn) {
        conn.add(object.getModel(), object.getResource());
    }

    @Override
    public <T extends Thing> void updateObject(T object, RepositoryConnection conn) {
        removeObject(object, conn);
        addObject(object, conn);
    }

    @Override
    public <T extends Thing> Optional<T> optObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn) {
        Model model = RepositoryResults.asModel(conn.getStatements(null, null, null, id), mf);
        return factory.getExisting(id, model);
    }

    @Override
    public <T extends Thing> T getObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn) {
        return optObject(id, factory, conn).orElseThrow(() ->
                new IllegalArgumentException(factory.getTypeIRI().getLocalName() + " " + id + " could not be found"));
    }

    @Override
    public <T extends Thing> T getExpectedObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn) {
        return optObject(id, factory, conn).orElseThrow(() ->
                new IllegalStateException(factory.getTypeIRI().getLocalName() + " " + id + " could not be found"));
    }

    @Override
    public void remove(Resource resourceId, RepositoryConnection conn) {
        conn.remove((Resource) null, null, null, resourceId);
    }

    @Override
    public <T extends Thing> void removeObject(T object, RepositoryConnection conn) {
        remove(object.getResource(), conn);
    }

    @Override
    public void validateRecord(Resource catalogId, Resource recordId, IRI recordType, RepositoryConnection conn) {
        validateResource(catalogId, vf.createIRI(Catalog.TYPE), conn);
        validateResource(recordId, recordType, conn);
        if (!conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), catalogId).hasNext()) {
            throw throwDoesNotBelong(recordId, recordFactory, catalogId, catalogFactory);
        }
    }

    @Override
    public <T extends Record> T getRecord(Resource catalogId, Resource recordId, OrmFactory<T> factory,
                                          RepositoryConnection conn) {
        validateRecord(catalogId, recordId, factory.getTypeIRI(), conn);
        return getObject(recordId, factory, conn);
    }

    @Override
    public void validateUnversionedDistribution(Resource catalogId, Resource recordId, Resource distributionId,
                                                RepositoryConnection conn) {
        UnversionedRecord record = getRecord(catalogId, recordId, unversionedRecordFactory, conn);
        Set<Resource> distributionIRIs = record.getUnversionedDistribution_resource();
        if (!distributionIRIs.contains(distributionId)) {
            throw throwDoesNotBelong(distributionId, distributionFactory, recordId, unversionedRecordFactory);
        }
    }

    @Override
    public Distribution getUnversionedDistribution(Resource catalogId, Resource recordId, Resource distributionId,
                                                   RepositoryConnection conn) {
        validateUnversionedDistribution(catalogId, recordId, distributionId, conn);
        return getObject(distributionId, distributionFactory, conn);
    }

    @Override
    public void validateVersion(Resource catalogId, Resource recordId, Resource versionId, RepositoryConnection conn) {
        VersionedRecord record = getRecord(catalogId, recordId, versionedRecordFactory, conn);
        Set<Resource> versionIRIs = record.getVersion_resource();
        if (!versionIRIs.contains(versionId)) {
            throw throwDoesNotBelong(versionId, versionFactory, recordId, versionedRecordFactory);
        }
    }

    @Override
    public <T extends Version> T getVersion(Resource catalogId, Resource recordId, Resource versionId,
                                            OrmFactory<T> factory, RepositoryConnection conn) {
        validateVersion(catalogId, recordId, versionId, conn);
        return getObject(versionId, factory, conn);
    }

    @Override
    public void validateVersionedDistribution(Resource catalogId, Resource recordId, Resource versionId,
                                              Resource distributionId, RepositoryConnection conn) {
        Version version = getVersion(catalogId, recordId, versionId, versionFactory, conn);
        if (!version.getVersionedDistribution_resource().contains(distributionId)) {
            throw throwDoesNotBelong(distributionId, distributionFactory, versionId, versionFactory);
        }
    }

    @Override
    public Distribution getVersionedDistribution(Resource catalogId, Resource recordId, Resource versionId,
                                                 Resource distributionId, RepositoryConnection conn) {
        validateVersionedDistribution(catalogId, recordId, versionId, distributionId, conn);
        return getObject(distributionId, distributionFactory, conn);
    }

    @Override
    public void validateBranch(Resource catalogId, Resource recordId, Resource branchId, RepositoryConnection conn) {
        VersionedRDFRecord record = getRecord(catalogId, recordId, versionedRDFRecordFactory, conn);
        testBranchPath(record, branchId);
    }

    private void testBranchPath(VersionedRDFRecord record, Resource branchId) {
        Set<Resource> branchIRIs = record.getBranch_resource();
        if (!branchIRIs.contains(branchId)) {
            throw throwDoesNotBelong(branchId, branchFactory, record.getResource(), versionedRDFRecordFactory);
        }
    }

    @Override
    public <T extends Branch> T getBranch(Resource catalogId, Resource recordId, Resource branchId,
                                          OrmFactory<T> factory, RepositoryConnection conn) {
        validateBranch(catalogId, recordId, branchId, conn);
        return getObject(branchId, factory, conn);
    }

    @Override
    public <T extends Branch> T getBranch(VersionedRDFRecord record, Resource branchId, OrmFactory<T> factory,
                                          RepositoryConnection conn) {
        testBranchPath(record, branchId);
        return getObject(branchId, factory, conn);
    }

    @Override
    public Resource getHeadCommitIRI(Branch branch) {
        return branch.getHead_resource().orElseThrow(() -> new IllegalStateException("Branch " + branch.getResource()
                + " does not have a head Commit set"));
    }

    @Override
    public void validateInProgressCommit(Resource catalogId, Resource recordId, Resource commitId,
                                         RepositoryConnection conn) {
        validateRecord(catalogId, recordId, versionedRDFRecordFactory.getTypeIRI(), conn);
        InProgressCommit commit = getObject(commitId, inProgressCommitFactory, conn);
        Resource onRecord = commit.getOnVersionedRDFRecord_resource().orElseThrow(() ->
                new IllegalStateException("Record was not set on InProgressCommit " + commitId));
        if (!onRecord.equals(recordId)) {
            throw throwDoesNotBelong(commitId, inProgressCommitFactory, recordId, versionedRDFRecordFactory);
        }
    }

    @Override
    public InProgressCommit getInProgressCommit(Resource recordId, Resource userId, RepositoryConnection conn) {
        Resource commitId = getInProgressCommitIRI(recordId, userId, conn).orElseThrow(() ->
                new IllegalArgumentException("InProgressCommit not found"));
        return getObject(commitId, inProgressCommitFactory, conn);
    }

    @Override
    public InProgressCommit getInProgressCommit(Resource catalogId, Resource recordId, Resource commitId,
                                                RepositoryConnection conn) {
        validateInProgressCommit(catalogId, recordId, commitId, conn);
        return getObject(commitId, inProgressCommitFactory, conn);
    }

    @Override
    public Optional<Resource> getInProgressCommitIRI(Resource recordId, Resource userId, RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(GET_IN_PROGRESS_COMMIT);
        query.setBinding(USER_BINDING, userId);
        query.setBinding(RECORD_BINDING, recordId);
        TupleQueryResult queryResult = query.evaluate();
        if (queryResult.hasNext()) {
            return Optional.of(Bindings.requiredResource(queryResult.next(), COMMIT_BINDING));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public void removeInProgressCommit(InProgressCommit commit, RepositoryConnection conn) {
        Revision revision = getRevision(commit.getResource(), conn);
        removeObject(commit, conn);

        Set<Resource> graphs = new HashSet<>();
        revision.getAdditions().ifPresent(graphs::add);
        revision.getDeletions().ifPresent(graphs::add);
        revision.getGraphRevision().forEach(graphRevision -> {
            graphRevision.getAdditions().ifPresent(graphs::add);
            graphRevision.getDeletions().ifPresent(graphs::add);
        });

        graphs.forEach(resource -> {
            if (!conn.contains(null, null, resource)) {
                remove(resource, conn);
            }
        });
    }

    @Override
    public void updateCommit(Commit commit, Model additions, Model deletions, RepositoryConnection conn) {
        Resource resource = commit.getGenerated_resource().stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Commit does not have a Revision."));
        Revision revision = revisionFactory.getExisting(resource, commit.getModel())
                .orElseThrow(() -> new IllegalStateException("Could not retrieve expected Revision."));
        updateCommit(commit.getResource(), revision, additions, deletions, conn);
    }

    @Override
    public void updateCommit(Resource commitId, Model additions, Model deletions, RepositoryConnection conn) {
        Revision revision = getRevision(commitId, conn);
        updateCommit(commitId, revision, additions, deletions, conn);
    }

    private void updateCommit(Resource commitId, Revision revision, @Nullable Model additions, @Nullable Model deletions, RepositoryConnection conn) {
        // Map of revisionedGraph -> GraphRevision resources
        Map<Resource, Resource> knownGraphs = new HashMap<>();
        revision.getGraphRevision().forEach(graphRevision -> {
            Resource graph = graphRevision.getRevisionedGraph()
                    .orElseThrow(() -> new IllegalStateException("Could not retrieve expected RevisionedGraph."));
            knownGraphs.put(graph, graphRevision.getResource());
        });

        IRI additionsGraph = revision.getAdditions().orElseThrow(() -> new IllegalStateException("Additions not set on Commit " + commitId.stringValue()));
        IRI deletionsGraph = revision.getDeletions().orElseThrow(() -> new IllegalStateException("Deletions not set on Commit " + commitId.stringValue()));

        Model filteredAdditions = additions == null ? null : additions.filter(null, null, null, (Resource)null);
        Model filteredDeletions = deletions == null ? null : deletions.filter(null, null, null, (Resource)null);
        addChanges(additionsGraph, deletionsGraph, filteredAdditions, conn);
        addChanges(deletionsGraph, additionsGraph, filteredDeletions, conn);

        Set<Resource> graphs = new HashSet<>();
        if (additions != null) graphs.addAll(additions.contexts());
        if (deletions != null) graphs.addAll(deletions.contexts());
        graphs.forEach(modifiedGraph -> {
            if (knownGraphs.containsKey(modifiedGraph)) {
                GraphRevision graphRevision = graphRevisionFactory
                        .getExisting(knownGraphs.get(modifiedGraph), revision.getModel())
                        .orElseThrow(() -> new IllegalStateException("Could not retrieve expected GraphRevision."));

                IRI adds = graphRevision.getAdditions().orElseThrow(() -> new IllegalStateException("Additions not set on Commit " + commitId.stringValue() + " for graph " + modifiedGraph.stringValue()));
                IRI dels = graphRevision.getDeletions().orElseThrow(() -> new IllegalStateException("Deletions not set on Commit " + commitId.stringValue() + " for graph " + modifiedGraph.stringValue()));

                Model filteredGraphAdditions = additions == null ? null : additions.filter(null, null, null, modifiedGraph);
                Model filteredGraphDeletions = deletions == null ? null : deletions.filter(null, null, null, modifiedGraph);
                addChanges(adds, dels, filteredGraphAdditions, conn);
                addChanges(dels, adds, filteredGraphDeletions, conn);
            } else {
                Resource graphRevisionResource = vf.createBNode();
                GraphRevision graphRevision = graphRevisionFactory.createNew(graphRevisionResource);
                graphRevision.setRevisionedGraph(modifiedGraph);

                String commitHash = vf.createIRI(commitId.stringValue()).getLocalName();
                String changesContextLocalName;
                try {
                    changesContextLocalName = commitHash + "%00" + URLEncoder.encode(modifiedGraph.stringValue(), "UTF-8");
                } catch (UnsupportedEncodingException e) {
                    throw new MatOntoException(e);
                }

                IRI additionsIRI = vf.createIRI(Catalogs.ADDITIONS_NAMESPACE + changesContextLocalName);
                IRI deletionsIRI = vf.createIRI(Catalogs.DELETIONS_NAMESPACE + changesContextLocalName);

                graphRevision.setAdditions(additionsIRI);
                graphRevision.setDeletions(deletionsIRI);

                conn.add(revision.getResource(), vf.createIRI(Revision.graphRevision_IRI), graphRevisionResource, commitId);
                conn.add(graphRevision.getModel(), commitId);

                Model filteredGraphAdditions = additions == null ? null : additions.filter(null, null, null, modifiedGraph);
                Model filteredGraphDeletions = deletions == null ? null : deletions.filter(null, null, null, modifiedGraph);
                addChanges(additionsIRI, deletionsIRI, filteredGraphAdditions, conn);
                addChanges(deletionsIRI, additionsIRI, filteredGraphDeletions, conn);
            }
        });
    }

    @Override
    public void addCommit(Branch branch, Commit commit, RepositoryConnection conn) {
        if (conn.containsContext(commit.getResource())) {
            throw throwAlreadyExists(commit.getResource(), commitFactory);
        }
        branch.setHead(commit);
        updateObject(branch, conn);
        addObject(commit, conn);
    }

    @Override
    public Revision getRevision(Resource commitId, RepositoryConnection conn) {
        Commit commit = getObject(commitId, commitFactory, conn);
        Resource revisionResource = commit.getGenerated_resource().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Commit does not have a Revision"));
        return revisionFactory.getExisting(revisionResource, commit.getModel())
                .orElseThrow(() -> new IllegalStateException("Could not retrieve revision from Commit."));
    }

    @Override
    public Stream<Statement> getAdditions(Resource commitId, RepositoryConnection conn) {
        return getAdditions(getRevision(commitId, conn), conn);
    }

    @Override
    public Stream<Statement> getAdditions(Commit commit, RepositoryConnection conn) {
        Resource resource = commit.getGenerated_resource().stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Commit does not have a Revision."));
        Revision revision = revisionFactory.getExisting(resource, commit.getModel())
                .orElseThrow(() -> new IllegalStateException("Could not retrieve expected Revision."));
        return getAdditions(revision, conn);
    }

    /**
     * Gets the addition statements for the provided Revision. Assumes additions are stored in the Repository.
     *
     * @param revision The Revision containing change statements.
     * @param conn The RepositoryConnection used to query the Repository.
     * @return A Stream of change Statements.
     */
    private Stream<Statement> getAdditions(Revision revision, RepositoryConnection conn) {
        List<Stream<Statement>> streams =  new ArrayList<>();

        // Get Triples
        revision.getAdditions().ifPresent(changesGraph -> collectChanges(streams, changesGraph, null, conn));

        // Get Versioned Graphs
        revision.getGraphRevision().forEach(graphRevision -> graphRevision.getAdditions()
                .ifPresent(changesGraph -> collectRevisionedGraphChanges(streams, graphRevision, changesGraph, conn)));

        // NOTE: Potential stack overflow with large number of streams
        return streams.stream()
                .reduce(Stream::concat)
                .orElseGet(Stream::empty);
    }

    @Override
    public Stream<Statement> getDeletions(Resource commitId, RepositoryConnection conn) {
        return getDeletions(getRevision(commitId, conn), conn);
    }

    @Override
    public Stream<Statement> getDeletions(Commit commit, RepositoryConnection conn) {
        Resource resource = commit.getGenerated_resource().stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Commit does not have a Revision."));
        Revision revision = revisionFactory.getExisting(resource, commit.getModel())
                .orElseThrow(() -> new IllegalStateException("Could not retrieve expected Revision."));
        return getDeletions(revision, conn);
    }

    /**
     * Gets the deletion statements for the provided Revision. Assumes deletions are stored in the Repository.
     *
     * @param revision The Revision containing change statements.
     * @param conn The RepositoryConnection used to query the Repository.
     * @return A Stream of change Statements.
     */
    private Stream<Statement> getDeletions(Revision revision, RepositoryConnection conn) {
        List<Stream<Statement>> streams =  new ArrayList<>();

        // Get Triples
        revision.getDeletions().ifPresent(changesGraph -> collectChanges(streams, changesGraph, null, conn));

        // Get Versioned Graphs
        revision.getGraphRevision().forEach(graphRevision -> graphRevision.getDeletions()
                .ifPresent(changesGraph -> collectRevisionedGraphChanges(streams, graphRevision, changesGraph, conn)));

        // NOTE: Potential stack overflow with large number of streams
        return streams.stream()
                .reduce(Stream::concat)
                .orElseGet(Stream::empty);
    }

    /**
     * Collects the change statements from the provided GraphRevision and adds them to the provided List of Streams.
     *
     * @param streams The List of Streams that collects the change statements.
     * @param graphRevision The GraphRevision from which to collect change statements.
     * @param changesGraph The context that contains the change statements.
     * @param conn The RepositoryConnection used to query the Repository.
     */
    private void collectRevisionedGraphChanges(List<Stream<Statement>> streams, GraphRevision graphRevision, IRI changesGraph, RepositoryConnection conn) {
        Resource versionedGraph = graphRevision.getRevisionedGraph()
                .orElseThrow(() -> new IllegalStateException("GraphRevision missing Revisioned Graph."));
        collectChanges(streams, changesGraph, versionedGraph, conn);
    }

    /**
     * Collects the change statements from the provided context and adds them to the provided List of Streams using the
     * provided context. Note, the versionedGraph is optional with null representing a changed triple instead of quad.
     *
     * @param streams The List of Streams that collects the change statements.
     * @param changesGraph The context that contains the change statements.
     * @param versionedGraph The context to use for the collected statements.
     * @param conn The RepositoryConnection used to query the Repository.
     */
    private void collectChanges(List<Stream<Statement>> streams, IRI changesGraph, Resource versionedGraph, RepositoryConnection conn) {
        RepositoryResult<Statement> statements = conn.getStatements(null, null, null, changesGraph);
        GraphRevisionIterator iterator = new GraphRevisionIterator(statements, versionedGraph);
        streams.add(StreamSupport.stream(iterator.spliterator(), false));
    }

    @Override
    public void addChanges(Resource targetNamedGraph, Resource oppositeNamedGraph, Model changes,
                           RepositoryConnection conn) {
        if (changes == null) return;

        changes.forEach(statement -> {
            if (!conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject(), oppositeNamedGraph)) {
                conn.add(statement, targetNamedGraph);
            } else {
                conn.remove(statement, oppositeNamedGraph);
            }
        });
    }

    @Override
    public void validateCommitPath(Resource catalogId, Resource recordId, Resource branchId, Resource commitId, 
                      RepositoryConnection conn) {
        validateBranch(catalogId, recordId, branchId, conn);
        if (!commitInBranch(branchId, commitId, conn)) {
            throw throwDoesNotBelong(commitId, commitFactory, branchId, branchFactory);
        }
    }

    @Override
    public boolean commitInBranch(Resource branchId, Resource commitId, RepositoryConnection conn) {
        Branch branch = getExpectedObject(branchId, branchFactory, conn);
        Resource head = getHeadCommitIRI(branch);
        return (head.equals(commitId) || getCommitChain(head, false, conn).contains(commitId));
    }
    
    @Override
    public List<Resource> getCommitChain(Resource commitId, boolean asc, RepositoryConnection conn) {
        List<Resource> results = new ArrayList<>();
        Iterator<Resource> commits = getCommitChainIterator(commitId, asc, conn);
        commits.forEachRemaining(results::add);
        return results;
    }

    @Override
    public Difference getCommitDifference(List<Resource> commits, RepositoryConnection conn) {
        Difference difference = new Difference.Builder()
                .additions(mf.createModel())
                .deletions(mf.createModel())
                .build();
        commits.forEach(commitId -> aggregateDifferences(difference, commitId, conn));
        return difference;
    }

    @Override
    public Model getCompiledResource(Resource commitId, RepositoryConnection conn) {
        return getCompiledResource(getCommitChain(commitId, false, conn), conn);
    }

    @Override
    public Model getCompiledResource(List<Resource> commits, RepositoryConnection conn) {
        Difference difference = getCommitDifference(commits, conn);
        return difference.getAdditions();
    }

    @Override
    public Difference getCommitDifference(Resource commitId, RepositoryConnection conn) {
        Revision revision = getRevision(commitId, conn);

        Model addModel = mf.createModel();
        Model deleteModel = mf.createModel();

        IRI additionsGraph = revision.getAdditions().orElseThrow(() -> new IllegalStateException("Additions not set on Commit " + commitId.stringValue()));
        IRI deletionsGraph = revision.getDeletions().orElseThrow(() -> new IllegalStateException("Deletions not set on Commit " + commitId.stringValue()));

        conn.getStatements(null, null, null, additionsGraph).forEach(statement ->
                addModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        conn.getStatements(null, null, null, deletionsGraph).forEach(statement ->
                deleteModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));

        revision.getGraphRevision().forEach(graphRevision -> {
            Resource graph = graphRevision.getRevisionedGraph().orElseThrow(() -> new IllegalStateException("GraphRevision missing Revisioned Graph."));
            IRI adds = graphRevision.getAdditions().orElseThrow(() -> new IllegalStateException("Additions not set on Commit " + commitId.stringValue()));
            IRI dels = graphRevision.getDeletions().orElseThrow(() -> new IllegalStateException("Deletions not set on Commit " + commitId.stringValue()));

            conn.getStatements(null, null, null, adds).forEach(statement ->
                    addModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject(), graph));
            conn.getStatements(null, null, null, dels).forEach(statement ->
                    deleteModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject(), graph));
        });

        return new Difference.Builder()
                .additions(addModel)
                .deletions(deleteModel)
                .build();
    }

    @Override
    public Model applyDifference(Model base, Difference diff) {
        Model result = mf.createModel(base);
        result.addAll(diff.getAdditions());
        result.removeAll(diff.getDeletions());
        return result;
    }

    @Override
    public <T extends Thing> IllegalArgumentException throwAlreadyExists(Resource id, OrmFactory<T> factory) {
        return new IllegalArgumentException(String.format("%s %s already exists", factory.getTypeIRI().getLocalName(),
                id));
    }

    @Override
    public <T extends Thing, S extends Thing> IllegalArgumentException throwDoesNotBelong(Resource child,
                                                                                          OrmFactory<T> childFactory,
                                                                                          Resource parent,
                                                                                          OrmFactory<S> parentFactory) {
        return new IllegalArgumentException(String.format("%s %s does not belong to %s %s",
                childFactory.getTypeIRI().getLocalName(), child, parentFactory.getTypeIRI().getLocalName(), parent));
    }

    @Override
    public <T extends Thing> IllegalStateException throwThingNotFound(Resource id, OrmFactory<T> factory) {
        return new IllegalStateException(String.format("%s %s could not be found", factory.getTypeIRI().getLocalName(),
                id));
    }

    /**
     * Gets an iterator which contains all of the Commit ids in the specified direction, either ascending or
     * descending by date. If descending, the provided Resource identifying a Commit will be first.
     *
     * @param commitId The Resource identifying the Commit that you want to get the chain for.
     * @param conn     The RepositoryConnection which will be queried for the Commits.
     * @param asc      Whether or not the iterator should be ascending by date
     * @return Iterator of Resource ids for the requested Commits.
     */
    private Iterator<Resource> getCommitChainIterator(Resource commitId, boolean asc, RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(GET_COMMIT_CHAIN);
        query.setBinding(COMMIT_BINDING, commitId);
        TupleQueryResult result = query.evaluate();
        LinkedList<Resource> commits = new LinkedList<>();
        result.forEach(bindings -> commits.add(Bindings.requiredResource(bindings, PARENT_BINDING)));
        commits.addFirst(commitId);
        return asc ? commits.descendingIterator() : commits.iterator();
    }

    /**
     * Updates the supplied Difference with statements from the Revision associated with the supplied Commit resource.
     * Revision addition statements are added to the Difference additions model. Revision deletion statements are
     * removed from the Difference additions model if they exist, otherwise they are added to the Difference deletions
     * model.
     *
     * @param difference    The Difference object to update.
     * @param commitId      The Resource identifying the Commit.
     * @param conn          The RepositoryConnection to query the repository.
     */
    private void aggregateDifferences(Difference difference, Resource commitId, RepositoryConnection conn) {
        Model additions = difference.getAdditions();
        Model deletions = difference.getDeletions();
        getAdditions(commitId, conn).forEach(statement -> updateModels(statement, additions, deletions));
        getDeletions(commitId, conn).forEach(statement -> updateModels(statement, deletions, additions));
    }

    /**
     * Remove the supplied triple from the modelToRemove if it exists, otherwise add the triple to modelToAdd.
     *
     * @param statement     The statement to process
     * @param modelToAdd    The Model to add the statement to if it does not exist in modelToRemove
     * @param modelToRemove The Model to remove the statement from if it exists
     */
    private void updateModels(Statement statement, Model modelToAdd, Model modelToRemove) {
        if (modelToRemove.contains(statement)) {
            modelToRemove.remove(statement);
        } else {
            modelToAdd.add(statement);
        }
    }

    private class GraphRevisionIterator implements Iterator<Statement>, Iterable<Statement> {
        private final Iterator<Statement> delegate;
        private final Resource graph;

        GraphRevisionIterator(Iterator<Statement> delegate, Resource graph) {
            this.delegate = delegate;
            this.graph = graph;
        }

        @Override
        public boolean hasNext() {
            return delegate.hasNext();
        }

        @Override
        public Statement next() {
            Statement statement = delegate.next();
            return vf.createStatement(statement.getSubject(), statement.getPredicate(), statement.getObject(), graph);
        }

        @Override
        public Iterator<Statement> iterator() {
            return this;
        }
    }
}
