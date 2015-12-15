package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.axiom.ObjectPropertyDomainAxiom;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;

public class SimpleObjectPropertyDomainAxiom 
	extends SimpleAxiom 
	implements ObjectPropertyDomainAxiom {

	
	private ObjectPropertyExpression objectProperty;
	private ClassExpression domain;
	
	
	public SimpleObjectPropertyDomainAxiom(ObjectPropertyExpression objectProperty, ClassExpression domain, Set<Annotation> annotations) 
	{
		super(annotations);
		this.objectProperty = Preconditions.checkNotNull(objectProperty, "objectProperty cannot be null");
		this.domain = Preconditions.checkNotNull(domain, "domain cannot be null");
	}

	
	@Override
	public ObjectPropertyDomainAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleObjectPropertyDomainAxiom(objectProperty, domain, NO_ANNOTATIONS);	
	}

	
	@Override
	public ObjectPropertyDomainAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleObjectPropertyDomainAxiom(objectProperty, domain, mergeAnnos(annotations));
	}


	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.OBJECT_PROPERTY_DOMAIN;
	}

	
	@Override
	public ObjectPropertyExpression getObjectProperty() 
	{
		return objectProperty;
	}

	
	@Override
	public ClassExpression getDomain() 
	{
		return domain;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof ObjectPropertyDomainAxiom) {
			ObjectPropertyDomainAxiom other = (ObjectPropertyDomainAxiom)obj;			 
			return ((objectProperty.equals(other.getObjectProperty())) && (domain.equals(other.getDomain())));
		}
		
		return false;
	}

}
