package org.matonto.rdf.core.api;

import java.io.Serializable;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public interface Model extends Set<Statement>, Serializable {

    /**
     * Adds one or more statements to the model. This method creates a statement for each specified context and adds
     * those to the model. If no contexts are specified, a single statement with no associated context is added.
     *
     * @param subject - The statement's subject.
     * @param predicate - The statement's predicate.
     * @param object - The statement's object.
     * @param context - The contexts to add statements to.
     * @return true if this Model did not already contain the specified element
     */
    boolean add(Resource subject, IRI predicate, Value object, Resource... context);

    /**
     * Removes statements with the specified context exist in this model.
     *
     * @param context - The context of the statements to remove.
     * @return true if one or more statements have been removed.
     */
    boolean clear(Resource... context);

    /**
     * Determines if statements with the specified subject, predicate, object and (optionally) context exist in this
     * model. The subject, predicate and object parameters can be null to indicate wildcards. The contexts parameter is
     * a wildcard and accepts zero or more values. If no contexts are specified, statements will match disregarding
     * their context. If one or more contexts are specified, statements with a context matching one of these will
     * match. Note: to match statements without an associated context, specify the value null and explicitly cast it to
     * type Resource.
     *
     * Examples:
     * model.contains(s1, null, null) is true if any statements in this model have subject s1,
     * model.contains(null, null, null, c1) is true if any statements in this model have context c1,
     * model.contains(null, null, null, (Resource)null) is true if any statements in this model have no associated
     * context,
     * model.contains(null, null, null, c1, c2, c3) is true if any statements in this model have context c1, c2 or c3.
     *
     * @param subject - The subject of the statements to match, null to match statements with any subject.
     * @param predicate - The predicate of the statements to match, null to match statements with any predicate.
     * @param object - The object of the statements to match, null to match statements with any object.
     * @param context - The contexts of the statements to match. If no contexts are specified, statements will match
     *                disregarding their context. If one or more contexts are specified, statements with a context
     *                matching one of these will match.
     * @return true if statements match the specified pattern.
     */
    boolean contains(Resource subject, IRI predicate, Value object, Resource... context);

    /**
     * Returns a Set view of the contexts contained in this model.
     *
     * @return a set view of the contexts contained in this model
     */
    default Set<Resource> contexts() {
        return stream().
                map(Statement::getContext).
                filter(Optional::isPresent).
                map(Optional::get).
                collect(Collectors.toSet());
    }

    /**
     * Returns a view of the statements with the specified subject, predicate, object and (optionally) context. The
     * subject, predicate and object parameters can be null to indicate wildcards. The contexts parameter is a wildcard
     * and accepts zero or more values. If no contexts are specified, statements will match disregarding their context.
     * If one or more contexts are specified, statements with a context matching one of these will match. Note: to match
     * statements without an associated context, specify the value null and explicitly cast it to type Resource.
     *
     * The returned model is backed by this Model, so changes to this Model are reflected in the returned model, and
     * vice-versa. If this Model is modified while an iteration over the returned model is in progress (except through
     * the iterator's own remove operation), the results of the iteration are undefined. The model supports element
     * removal, which removes the corresponding statement from this Model, via the Iterator.remove, Set.remove,
     * removeAll, retainAll, and clear operations. The statements passed to the add and addAll operations must match the
     * parameter pattern.
     *
     * Examples:
     * model.filter(s1, null, null) matches all statements that have subject s1,
     * model.filter(null, null, null, c1) matches all statements that have context c1,
     * model.filter(null, null, null, (Resource)null) matches all statements that have no associated context,
     * model.filter(null, null, null, c1, c2, c3) matches all statements that have context c1, c2 or c3.
     *
     * @param subject - The subject of the statements to match, null to match statements with any subject.
     * @param predicate - The predicate of the statements to match, null to match statements with any predicate.
     * @param object - The object of the statements to match, null to match statements with any object.
     * @param context - The contexts of the statements to match. If no contexts are specified, statements will match
     *                disregarding their context. If one or more contexts are specified, statements with a context
     *                matching one of these will match.
     * @return The statements that match the specified pattern.
     */
    Model filter(Resource subject, IRI predicate, Value object, Resource... context);

    /**
     * Gets the namespace that is associated with the specified prefix, if any.
     *
     * @param prefix - A namespace prefix.
     * @return The namespace name that is associated with the specified prefix, or {@link Optional#empty()} if there
     * is no such namespace.
     */
    default Optional<Namespace> getNamespace(String prefix) {
        return getNamespaces().stream().filter(t -> t.getPrefix().equals(prefix)).findAny();
    }

    /**
     * Gets the map that contains the assigned namespaces.
     *
     * @return Map of prefix to namespace
     */
    Set<Namespace> getNamespaces();

    /**
     * Returns a Set view of the objects contained in this model.
     *
     * @return a set view of the objects contained in this model
     */
    default Set<Value> objects() {
        return stream().map(Statement::getObject).collect(Collectors.toSet());
    }

    /**
     * Returns a Set view of the predicates contained in this model.
     *
     * @return a set view of the predicates contained in this model
     */
    default Set<IRI> predicates() {
        return stream().map(Statement::getPredicate).collect(Collectors.toSet());
    }

    /**
     * Removes statements with the specified subject, predicate, object and (optionally) context exist in this model.
     * The subject, predicate and object parameters can be null to indicate wildcards. The contexts parameter is a
     * wildcard and accepts zero or more values. If no contexts are specified, statements will be removed disregarding
     * their context. If one or more contexts are specified, statements with a context matching one of these will be
     * removed. Note: to remove statements without an associated context, specify the value null.
     *
     * Examples:
     * model.remove(s1, null, null) removes any statements in this model have subject s1,
     * model.remove(null, null, null, c1) removes any statements in this model have context c1,
     * model.remove(null, null, null, null) removes any statements in this model have no associated context,
     * model.remove(null, null, null, c1, c2, c3) removes any statements in this model have context c1, c2 or c3.
     *
     * @param subject - The subject of the statements to remove, null to remove statements with any subject.
     * @param predicate - The predicate of the statements to remove, null to remove statements with any predicate.
     * @param object - The object of the statements to remove, null to remove statements with any object.
     * @param context - The contexts of the statements to remove. If no contexts are specified, statements will be
     *                removed disregarding their context. If one or more contexts are specified, statements with a
     *                context matching one of these will be removed.
     * @return true if one or more statements have been removed.
     */
    boolean remove(Resource subject, IRI predicate, Value object, Resource... context);

    /**
     * Removes a namespace declaration by removing the association between a prefix and a namespace name.
     *
     * @param prefix - The namespace prefix of which the assocation with a namespace name is to be removed.
     * @return the previous namespace bound to the prefix or Optional.empty()
     */
    Optional<Namespace> removeNamespace(String prefix);

    /**
     * Sets the prefix for a namespace. This will replace any existing namespace associated to the prefix.
     *
     * @param namespace - A Namespace object to use in this Model.
     */
    void setNamespace(Namespace namespace);

    /**
     * Sets the prefix for a namespace. This will replace any existing namespace associated to the prefix.
     *
     * @param prefix - The new prefix.
     * @param name - The namespace name that the prefix maps to.
     * @return The Namespace object for the given namespace.
     */
    Namespace setNamespace(String prefix, String name);

    /**
     * Returns a Set view of the subjects contained in this model.
     *
     * @return a set view of the subjects contained in this model
     */
    default Set<Resource> subjects() {
        return stream().map(Statement::getSubject).collect(Collectors.toSet());
    }

    /**
     * Returns an unmodifiable view of this model. This method provides "read-only" access to this model. Query
     * operations on the returned model "read through" to this model, and attempts to modify the returned model, whether
     * direct or via its iterator, result in an UnsupportedOperationException.
     *
     * @return an unmodifiable view of the specified set.
     */
    Model unmodifiable();
}
