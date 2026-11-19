export function BookDetailsSkeleton() {
  return (
    <>
      <p role="status" className="visually-hidden">
        Loading book...
      </p>
      <div className="book-details row g-4 mx-0 placeholder-glow" aria-hidden="true">
        <div className="col-8 col-sm-5 col-md-4 col-lg-3 mx-auto mx-md-0">
          <span className="placeholder book-cover d-block w-100" />
        </div>
        <div className="col-12 col-md">
          <span className="placeholder placeholder-lg col-8 d-block mb-3" />
          <span className="placeholder col-4 d-block mb-4" />
          <span className="placeholder col-12 d-block mb-2" />
          <span className="placeholder col-11 d-block mb-2" />
          <span className="placeholder col-9 d-block" />
        </div>
      </div>
    </>
  )
}
